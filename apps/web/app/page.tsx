"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  LayoutGrid,
  LogOut,
  Loader2,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@whiteboard/ui";

interface BoardItem {
  id: string;
  name: string;
  updatedAt: string;
  owner: { name: string | null; image: string | null };
  _count: { members: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBoards = useCallback(async () => {
    try {
      const res = await fetch("/api/boards");
      const json = await res.json();
      setBoards(json.data ?? []);
    } catch {
      console.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchBoards();
    }
  }, [status, router, fetchBoards]);

  const createBoard = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Board" }),
      });
      const json = await res.json();
      if (json.data?.id) {
        router.push(`/board/${json.data.id}`);
      }
    } catch {
      console.error("Failed to create board");
    } finally {
      setCreating(false);
    }
  };

  const deleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this board?")) return;

    try {
      await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch {
      console.error("Failed to delete board");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Whiteboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Board Grid */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your Boards</h1>
          <Button onClick={createBoard} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Board
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-20">
            <LayoutGrid className="mb-4 h-12 w-12 text-zinc-300" />
            <p className="mb-2 text-lg font-medium text-zinc-500">
              No boards yet
            </p>
            <p className="mb-6 text-sm text-zinc-400">
              Create your first board to get started
            </p>
            <Button onClick={createBoard} disabled={creating}>
              <Plus className="h-4 w-4" />
              Create Board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* New board card */}
            <button
              onClick={createBoard}
              disabled={creating}
              className="group flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 transition-all hover:border-zinc-400 hover:bg-zinc-50"
            >
              <Plus className="mb-2 h-8 w-8 text-zinc-300 transition-colors group-hover:text-zinc-500" />
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-600">
                New Board
              </span>
            </button>

            {/* Board cards */}
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => router.push(`/board/${board.id}`)}
                className="group relative flex h-48 cursor-pointer flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Board preview area */}
                <div className="flex-1 rounded-lg bg-board-bg board-canvas" />

                {/* Board info */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 truncate max-w-[160px]">
                      {board.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(board.updatedAt).toLocaleDateString()}
                      {board._count.members > 1 &&
                        ` · ${board._count.members} members`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteBoard(board.id, e)}
                    className="rounded-md p-1.5 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
