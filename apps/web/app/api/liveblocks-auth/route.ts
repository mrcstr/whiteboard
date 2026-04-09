import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Liveblocks } from "@liveblocks/node";
import { authOptions } from "@/lib/auth";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Predefined colors for user cursors
const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

function getColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { room } = await req.json();

  const liveblocksSession = liveblocks.prepareSession(session.user.id, {
    userInfo: {
      name: session.user.name ?? "Anonymous",
      email: session.user.email ?? "",
      avatar: session.user.image ?? undefined,
      color: getColorFromId(session.user.id),
    },
  });

  // Grant access to the requested room (board)
  liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);

  const { status, body } = await liveblocksSession.authorize();
  return new NextResponse(body, { status });
}
