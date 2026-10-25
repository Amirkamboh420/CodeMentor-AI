import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/next-auth-options";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/** GET /api/prompts — list saved prompt presets for the current user */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const admin = isAdmin(session.user.role);

  const prompts = await db.prompt.findMany({
    where: admin ? {} : { userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ prompts });
}

/** POST /api/prompts — create a preset for the current user */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const body = await req.json().catch(() => null);
  if (!body || !body.title || !body.prompt) {
    return NextResponse.json(
      { error: "title and prompt are required" },
      { status: 400 }
    );
  }
  const prompt = await db.prompt.create({
    data: {
      title: body.title,
      prompt: body.prompt,
      requestType: body.requestType || "generate",
      techStack: body.techStack || "",
      userId,
    },
  });
  return NextResponse.json({ prompt });
}
