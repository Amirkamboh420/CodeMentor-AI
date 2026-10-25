import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const { id } = await params;
  const prompt = await db.prompt.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (prompt.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.prompt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

/** PATCH — rename a preset (title) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const { id } = await params;
  const prompt = await db.prompt.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (prompt.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }
  const updated = await db.prompt.update({
    where: { id },
    data: { title: body.title.trim() },
  });
  return NextResponse.json({ prompt: updated });
}
