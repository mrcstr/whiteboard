import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@whiteboard/db";

interface Params {
  params: { boardId: string };
}

// GET /api/boards/:boardId
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const board = await db.board.findFirst({
    where: {
      id: params.boardId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json({ data: board });
}

// PATCH /api/boards/:boardId
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const board = await db.board.updateMany({
    where: {
      id: params.boardId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id, role: { in: ["owner", "editor"] } } } },
      ],
    },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
    },
  });

  if (board.count === 0) {
    return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });
  }

  return NextResponse.json({ data: { success: true } });
}

// DELETE /api/boards/:boardId
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db.board.deleteMany({
    where: {
      id: params.boardId,
      ownerId: session.user.id, // Only owner can delete
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });
  }

  return NextResponse.json({ data: { success: true } });
}
