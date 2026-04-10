import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boards = await db.board.findMany({ where: { ownerId: session.user.id } });
  return NextResponse.json({ data: boards });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = body.name?.trim() || "Untitled Board";

  const board = await db.board.create({
    data: {
      name,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id, role: "owner" } },
    },
  });

  return NextResponse.json({ data: board }, { status: 201 });
}