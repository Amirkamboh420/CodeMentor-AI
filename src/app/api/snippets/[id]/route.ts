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
  const snippet = await db.snippet.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!snippet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (snippet.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db.snippet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

/** PATCH — update snippet title, code, language, and/or tags */
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
  const snippet = await db.snippet.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!snippet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (snippet.userId !== userId && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: {
    title?: string;
    code?: string;
    language?: string;
    tags?: string;
  } = {};
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.code === "string") data.code = body.code;
  if (typeof body.language === "string") data.language = body.language;
  if (typeof body.tags === "string") data.tags = body.tags;
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }
  const updated = await db.snippet.update({
    where: { id },
    data,
  });
  return NextResponse.json({ snippet: updated });
}
