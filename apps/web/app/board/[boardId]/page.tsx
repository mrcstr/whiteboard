"use client";

import React from "react";
import { useParams } from "next/navigation";
import { RoomProvider, LiveMap, LiveList } from "@/lib/liveblocks";
import { Canvas } from "@/components/board/Canvas";
import { Toolbar } from "@/components/board/Toolbar";
import { BoardHeader } from "@/components/layout/BoardHeader";
import { Cursors } from "@/components/board/Cursors";
import { ClientSideSuspense } from "@liveblocks/react";
import { Loader2 } from "lucide-react";
import { Minimap } from "@/components/board/Minimap";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.boardId as string;

  return (
    <RoomProvider
      id={`board-${boardId}`}
      initialPresence={{
        cursor: null,
        selectedElementIds: [],
        name: "",
        color: "#3b82f6",
      }}
      initialStorage={{
        elements: new LiveMap<string, any>(),
elementOrder: new LiveList<string>([]),
      }}
    >
      <ClientSideSuspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-board-bg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <span className="text-sm text-zinc-500">Loading board…</span>
            </div>
          </div>
        }
      >
        {() => (
          <div className="relative h-screen w-screen overflow-hidden">
            <BoardHeader boardId={boardId} />
            <Canvas />
            <Toolbar />
            <Minimap />
            <Cursors />
          </div>
        )}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
