"use client";

import React, { memo } from "react";
import { useOthers } from "@/lib/liveblocks";
import { useEditorStore, canvasToScreen } from "@whiteboard/editor";

export function Cursors() {
  const others = useOthers();
  const camera = useEditorStore((s) => s.camera);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {others.map(({ connectionId, presence, info }) => {
        if (!presence?.cursor) return null;

        const screenPos = canvasToScreen(presence.cursor, camera);

        return (
          <CursorDisplay
            key={connectionId}
            x={screenPos.x}
            y={screenPos.y}
            name={info?.name ?? presence.name ?? "Anonymous"}
            color={info?.color ?? presence.color ?? "#6366f1"}
          />
        );
      })}
    </div>
  );
}

interface CursorProps {
  x: number;
  y: number;
  name: string;
  color: string;
}

const CursorDisplay = memo(function CursorDisplay({ x, y, name, color }: CursorProps) {
  return (
    <div
      className="absolute -left-1 -top-1 transition-transform duration-75 ease-out"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      {/* Cursor arrow */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="drop-shadow-sm"
      >
        <path
          d="M3 3l14 6.5L10 12l-2.5 7L3 3z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Name tag */}
      <div
        className="absolute left-4 top-4 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
});
