import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/conversations - list conversations for the current user (pinned
 * first, then most recent). Admins see all conversations.
 *
 * Optional query: ?q=<text> — full-text search across title, tags, AND
 * message content (role/prompt/content).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const admin = isAdmin(session.user.role);

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";

  // Build the where clause: scope to the current user (unless admin),
  // then add the optional full-text search filters on top.
  const ownerWhere = admin ? {} : { userId };
  const where = q
    ? {
        ...ownerWhere,
        OR: [
          { title: { contains: q } },
          { tags: { contains: q } },
          { requestType: { contains: q } },
          {
            messages: {
              some: {
                OR: [
                  { content: { contains: q } },
                  { prompt: { contains: q } },
                ],
              },
            },
          },
        ],
      }
    : ownerWhere;

  const conversations = await db.conversation.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 50,
    include: {
      _count: { select: { messages: true } },
      messages: {
        select: { tokenEstimate: true },
      },
    },
  });

  // Sum token estimates per conversation for display in the history list
  const withTokens = conversations.map((c) => {
    const totalTokens = c.messages.reduce(
      (sum, m) => sum + (m.tokenEstimate || 0),
      0
    );
    // Strip the messages array — we only needed it for the sum
    const { messages: _messages, ...rest } = c;
    void _messages;
    return { ...rest, totalTokens };
  });

  return NextResponse.json({ conversations: withTokens });
}

/**
 * POST /api/conversations - create a new conversation stub for the
 * authenticated user.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const body = await req.json().catch(() => ({}));
  const conversation = await db.conversation.create({
    data: {
      title: body.title || "New conversation",
      requestType: body.requestType || "generate",
      techStack: (body.techStack || []).join(", "),
      developerLevel: body.developerLevel || "intermediate",
      userId,
    },
  });
  return NextResponse.json({ conversation });
}
