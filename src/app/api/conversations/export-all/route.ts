import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/conversations/export-all
 * Returns ALL conversations owned by the current user with their messages as
 * a single JSON payload, suitable for bulk backup. Admins receive every
 * conversation in the system. Each conversation is versioned and
 * self-contained.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const admin = isAdmin(session.user.role);

  const conversations = await db.conversation.findMany({
    where: admin ? {} : { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  const exportable = conversations.map((conv) => ({
    version: 1 as const,
    title: conv.title,
    requestType: conv.requestType,
    techStack: conv.techStack,
    developerLevel: conv.developerLevel,
    pinned: conv.pinned,
    tags: conv.tags,
    exportedAt: new Date().toISOString(),
    messages: conv.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      requestType: m.requestType || undefined,
      prompt: m.prompt || undefined,
      code: m.code || undefined,
      filePath: m.filePath || undefined,
      fileType: m.fileType || undefined,
      feedback: m.feedback || undefined,
      createdAt: m.createdAt.toISOString(),
    })),
  }));

  return NextResponse.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    count: exportable.length,
    conversations: exportable,
  });
}
