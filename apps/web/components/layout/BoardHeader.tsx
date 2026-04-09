"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOthers, useSelf } from "@/lib/liveblocks";
import { Avatar, Button } from "@whiteboard/ui";
import { ArrowLeft, Share2, Users, Check, Copy } from "lucide-react";

interface Props {
  boardId: string;
}

export function BoardHeader({ boardId }: Props) {
  const router = useRouter();
  const others = useOthers();
  const self = useSelf();
  const [boardName, setBoardName] = useState("Untitled Board");
  const [isEditing, setIsEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/boards/${boardId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.name) setBoardName(json.data.name);
      })
      .catch(() => {});
  }, [boardId]);

  const saveName = useCallback(
    async (name: string) => {
      setBoardName(name);
      setIsEditing(false);
      await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).catch(() => {});
    },
    [boardId],
  );

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeUsers = others.length + 1; // +1 for self

  return (
    <header className="absolute left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-md">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {isEditing ? (
          <input
            autoFocus
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onBlur={(e) => saveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName(boardName);
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="rounded-md border px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-zinc-300"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md px-2 py-1 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
          >
            {boardName}
          </button>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Active user avatars */}
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {self && (
              <Avatar
                name={self.info?.name}
                color={self.info?.color}
                src={self.info?.avatar}
                size="sm"
              />
            )}
            {others.slice(0, 4).map(({ connectionId, info }) => (
              <Avatar
                key={connectionId}
                name={info?.name}
                color={info?.color}
                src={info?.avatar}
                size="sm"
              />
            ))}
          </div>
          {activeUsers > 1 && (
            <span className="ml-1.5 flex items-center gap-1 text-xs text-zinc-500">
              <Users className="h-3 w-3" />
              {activeUsers}
            </span>
          )}
        </div>

        {/* Share button */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShare(!showShare)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>

          {showShare && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border bg-white p-4 shadow-lg animate-scale-in">
              <p className="mb-3 text-sm font-medium text-zinc-800">
                Share this board
              </p>
              <p className="mb-3 text-xs text-zinc-500">
                Anyone with the link can join and collaborate in real-time.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="flex-1 rounded-lg border bg-zinc-50 px-3 py-2 text-xs text-zinc-600"
                />
                <Button size="sm" onClick={copyLink}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
