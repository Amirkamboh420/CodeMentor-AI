import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/** GET /api/stats - dashboard metrics, scoped to the current user (admins
 *  see global metrics). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const admin = isAdmin(session.user.role);

  // For non-admins, scope every query to conversations owned by them.
  // Admins see global stats (no userId filter).
  const convWhere = admin ? {} : { userId };

  const [conversations, messages, feedback, snippets] = await Promise.all([
    db.conversation.count({ where: convWhere }),
    db.message.count({
      where: admin ? {} : { conversation: { userId } },
    }),
    db.feedback.findMany({
      where: admin
        ? {}
        : // Feedback has no direct userId — filter via the message →
          // conversation → user relation.
          { message: { conversation: { userId } } },
    }),
    db.snippet.count({ where: convWhere }),
  ]);

  const helpful = feedback.filter((f) => f.helpful === "yes").length;
  const partial = feedback.filter((f) => f.helpful === "partial").length;
  const no = feedback.filter((f) => f.helpful === "no").length;
  const codeWorkedCount = feedback.filter((f) => f.codeWorked).length;

  const byRequestType = await db.message.groupBy({
    by: ["requestType"],
    _count: { _all: true },
    where: admin
      ? { role: "user" }
      : { role: "user", conversation: { userId } },
  });

  const tokensByConversation = await db.message.aggregate({
    _sum: { tokenEstimate: true },
    where: admin ? {} : { conversation: { userId } },
  });

  return NextResponse.json({
    conversations,
    messages,
    snippets,
    feedback: {
      total: feedback.length,
      helpful,
      partial,
      no,
      codeWorked: codeWorkedCount,
      satisfactionRate:
        feedback.length > 0
          ? Math.round((helpful / feedback.length) * 100)
          : 0,
    },
    byRequestType: byRequestType.map((g) => ({
      type: g.requestType || "unknown",
      count: g._count._all,
    })),
    totalTokens: tokensByConversation._sum.tokenEstimate || 0,
  });
}
