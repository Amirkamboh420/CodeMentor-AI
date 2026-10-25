import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";
import {
  SYSTEM_PROMPT,
  buildUserMessage,
  estimateTokens,
  type AssistRequest,
} from "@/lib/assistant";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Parse an SSE-formatted chunk buffer into {data lines, remainder}.
 * Each SSE event is `data: <json>\n\n`.
 */
function parseSseChunk(
  buffer: string
): { lines: string[]; remainder: string } {
  const lines: string[] = [];
  let remainder = buffer;
  // SSE events are separated by \n\n
  while (true) {
    const idx = remainder.indexOf("\n");
    if (idx === -1) break;
    const line = remainder.slice(0, idx);
    remainder = remainder.slice(idx + 1);
    if (line.startsWith("data: ")) {
      lines.push(line.slice(6));
    } else if (line.trim() === "") {
      // event separator, skip
      continue;
    }
  }
  return { lines, remainder };
}

/**
 * POST /api/assist
 * Streams an AI code-assistant response as Server-Sent Events using true
 * SDK streaming (stream: true) for low time-to-first-token.
 *
 * Body: AssistRequest (requestType, userPrompt, selectedCode, ...)
 * Optional query: ?conversationId=xxx  (persists into an existing conversation)
 *
 * SSE events:
 *   data: {"type":"meta","conversationId":"...","messageId":"..."}
 *   data: {"type":"delta","text":"..."}
 *   data: {"type":"done","streamed":true}
 *   data: {"type":"error","message":"..."}
 */
export async function POST(req: NextRequest) {
  // --- Auth: must be authenticated before any streaming begins ---
  // We return a plain JSON 401 (NOT an SSE stream) so the client can
  // detect it via response.status and redirect to /login.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const sessionRole = session.user.role as string | undefined;

  let body: AssistRequest;
  try {
    body = (await req.json()) as AssistRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const {
    requestType,
    userPrompt,
    selectedCode = "",
    filePath,
    fileType,
    techStack = [],
    developerLevel = "intermediate",
    timeConstraint,
    history = [],
  } = body;

  if (!userPrompt || userPrompt.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: "userPrompt is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const conversationId =
    new URL(req.url).searchParams.get("conversationId") || null;

  const userMessage = buildUserMessage({
    requestType,
    userPrompt,
    selectedCode,
    filePath,
    fileType,
    techStack,
    developerLevel,
    timeConstraint,
    history,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      let conversation: { id: string; userId: string | null } | null = null;
      let userMessageRow: { id: string } | null = null;

      try {
        // Persist conversation + user message
        if (conversationId) {
          conversation = await db.conversation.findUnique({
            where: { id: conversationId },
          });
          // Ownership check: if the conversation exists but belongs to
          // another user (and the current user isn't an admin), reject
          // before streaming starts. Send a JSON 403 (not an SSE stream)
          // so the client can show a clean error.
          if (
            conversation &&
            conversation.userId !== userId &&
            !isAdmin(sessionRole)
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  message: "Forbidden: you don't own this conversation",
                })}\n\n`
              )
            );
            controller.close();
            return;
          }
        }
        if (!conversation) {
          const title =
            userPrompt.length > 50
              ? userPrompt.slice(0, 50) + "..."
              : userPrompt;
          conversation = await db.conversation.create({
            data: {
              title,
              requestType,
              techStack: techStack.join(", "),
              developerLevel,
              // Stamp the authenticated user so the conversation is owned
              // by them and shows up in their history / dashboard.
              userId,
            },
          });
        }

        userMessageRow = await db.message.create({
          data: {
            conversationId: conversation.id,
            role: "user",
            content: userMessage,
            requestType,
            prompt: userPrompt,
            code: selectedCode || null,
            filePath: filePath || null,
            fileType: fileType || null,
            tokenEstimate: estimateTokens(userMessage),
          },
        });

        send({
          type: "meta",
          conversationId: conversation.id,
          messageId: userMessageRow.id,
        });

        // Build the SDK message list. Use 'assistant' role for the system
        // prompt per z-ai-web-dev-sdk convention.
        const messages: { role: "assistant" | "user"; content: string }[] = [
          { role: "assistant", content: SYSTEM_PROMPT },
          ...history.map((h) => ({
            role: h.role,
            content: h.content,
          })),
          { role: "user", content: userMessage },
        ];

        const zai = await ZAI.create();

        // --- True SDK streaming ---
        // With stream: true, the SDK returns response.body — a Web
        // ReadableStream<Uint8Array> of SSE chunks from the upstream API.
        // We read it, parse SSE `data:` lines, and forward delta text.
        let fullResponse = "";
        let usedStreaming = false;

        try {
          const result = await zai.chat.completions.create({
            messages,
            thinking: { type: "disabled" },
            stream: true,
          });

          // The SDK returns response.body (ReadableStream) when streaming.
          const readable = result as unknown as ReadableStream<Uint8Array>;
          if (readable && typeof readable.getReader === "function") {
            const reader = readable.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const { lines, remainder } = parseSseChunk(buffer);
              buffer = remainder;
              for (const line of lines) {
                if (line === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(line);
                  const delta =
                    parsed?.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    fullResponse += delta;
                    send({ type: "delta", text: delta });
                  }
                } catch {
                  // partial JSON, skip
                }
              }
            }
            usedStreaming = true;
          } else {
            // SDK returned a non-streaming object despite stream: true
            throw new Error("SDK did not return a ReadableStream");
          }
        } catch (streamErr) {
          // Fallback: if true streaming fails, use a non-streaming
          // completion and chunk it for a typing effect.
          console.warn(
            "[/api/assist] streaming unavailable, falling back:",
            streamErr instanceof Error ? streamErr.message : streamErr
          );
          const completion = await zai.chat.completions.create({
            messages,
            thinking: { type: "disabled" },
          });
          fullResponse =
            completion.choices?.[0]?.message?.content || "";
          if (fullResponse) {
            const chunkSize = 6;
            let i = 0;
            while (i < fullResponse.length) {
              const slice = fullResponse.slice(i, i + chunkSize);
              send({ type: "delta", text: slice });
              i += chunkSize;
              await new Promise((r) => setTimeout(r, 12));
            }
          }
        }

        if (!fullResponse) {
          send({ type: "error", message: "Empty response from model" });
          controller.close();
          return;
        }

        // Persist assistant message
        await db.message.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: fullResponse,
            requestType,
            tokenEstimate: estimateTokens(fullResponse),
          },
        });

        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        send({ type: "done", streamed: usedStreaming });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown assistant error";
        console.error("[/api/assist] error:", err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
