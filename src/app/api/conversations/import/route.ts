import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";

export const runtime = "nodejs";

interface ImportMessage {
  role: "user" | "assistant";
  content: string;
  requestType?: string;
  prompt?: string;
  code?: string;
  filePath?: string;
  fileType?: string;
  feedback?: string;
  createdAt?: string;
}

interface ImportPayload {
  version?: number;
  title: string;
  requestType?: string;
  techStack?: string;
  developerLevel?: string;
  pinned?: boolean;
  tags?: string;
  messages: ImportMessage[];
}

/**
 * POST /api/conversations/import
 * Imports a conversation (with its messages) from a JSON payload.
 * Returns the created conversation id.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  let body: ImportPayload;
  try {
    body = (await req.json()) as ImportPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body || typeof body.title !== "string" || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "Invalid conversation payload: title and messages are required" },
      { status: 400 }
    );
  }

  const conversation = await db.conversation.create({
    data: {
      title: body.title.slice(0, 200),
      requestType: body.requestType || "generate",
      techStack: typeof body.techStack === "string" ? body.techStack : "",
      developerLevel: body.developerLevel || "intermediate",
      pinned: !!body.pinned,
      tags: typeof body.tags === "string" ? body.tags : "",
      // Stamp the authenticated user as the owner of the imported
      // conversation so it shows up in their history.
      userId,
    },
  });

  // Create messages
  for (const m of body.messages) {
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content || "",
        requestType: m.requestType || null,
        prompt: m.prompt || null,
        code: m.code || null,
        filePath: m.filePath || null,
        fileType: m.fileType || null,
        feedback: m.feedback || null,
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
      },
    });
  }

  return NextResponse.json({ conversation });
}
