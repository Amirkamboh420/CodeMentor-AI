import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** POST /api/auth/verify-email — verify an email with a token */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const verifyToken = await db.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verifyToken || verifyToken.used || verifyToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: verifyToken.userId },
      data: { emailVerified: new Date() },
    });

    await db.emailVerificationToken.update({
      where: { id: verifyToken.id },
      data: { used: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-email] error:", err);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
