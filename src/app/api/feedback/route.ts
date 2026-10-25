import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";

export const runtime = "nodejs";

/**
 * POST /api/feedback
 * Body: { messageId, helpful, reason?, usedCode?, codeWorked?, improvement? }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.messageId) {
    return NextResponse.json(
      { error: "messageId is required" },
      { status: 400 }
    );
  }
  const feedback = await db.feedback.create({
    data: {
      messageId: body.messageId,
      helpful: body.helpful || "partial",
      reason: body.reason || null,
      usedCode: !!body.usedCode,
      codeWorked: !!body.codeWorked,
      improvement: body.improvement || null,
    },
  });
  // also stamp the message
  await db.message.update({
    where: { id: body.messageId },
    data: { feedback: body.helpful },
  });
  return NextResponse.json({ feedback });
}
