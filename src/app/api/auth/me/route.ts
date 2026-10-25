import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth-options";

export const runtime = "nodejs";

/** GET /api/auth/me — returns the current user's session */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: (session.user as { id?: string }).id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as { role?: string }).role,
      emailVerified: (session.user as { emailVerified?: string | null })
        .emailVerified,
    },
  });
}
