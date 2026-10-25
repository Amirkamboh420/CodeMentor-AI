import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/** GET /api/snippets — list snippets for the current user (admins see all) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const admin = isAdmin(session.user.role);

  const snippets = await db.snippet.findMany({
    where: admin ? {} : { userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ snippets });
}

/** POST /api/snippets — create a snippet for the current user */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const body = await req.json().catch(() => null);
  if (!body || !body.title || !body.code) {
    return NextResponse.json(
      { error: "title and code are required" },
      { status: 400 }
    );
  }
  const snippet = await db.snippet.create({
    data: {
      title: body.title,
      code: body.code,
      language: body.language || "typescript",
      tags: (body.tags || []).join(", "),
      source: body.source || "manual",
      userId,
    },
  });
  return NextResponse.json({ snippet });
}
