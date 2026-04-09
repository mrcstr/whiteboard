"use client";

import React, { useRef, useEffect } from "react";
import type { StickyNoteElement } from "@whiteboard/types";

const STICKY_COLORS: Record<string, string> = {
  yellow: "#fef08a",
  blue: "#93c5fd",
  green: "#86efac",
  pink: "#f9a8d4",
  purple: "#c4b5fd",
  orange: "#fdba74",
  gray: "#d4d4d8",
};

interface Props {
  element: StickyNoteElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<StickyNoteElement>) => void;
  onStopEditing: () => void;
}

export function StickyNote({ element, isEditing, onUpdate, onStopEditing }: Props) {
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const bgColor = STICKY_COLORS[element.color] ?? STICKY_COLORS.yellow;

  return (
    <div
      className="flex h-full w-full flex-col rounded-md p-3 sticky-shadow"
      style={{ backgroundColor: bgColor }}
    >
      {/* Top fold effect */}
      <div
        className="absolute right-0 top-0 h-6 w-6"
        style={{
          background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)`,
        }}
      />

      {isEditing ? (
        <textarea
          ref={textRef}
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          onBlur={onStopEditing}
          onKeyDown={(e) => {
            if (e.key === "Escape") onStopEditing();
          }}
          className="flex-1 resize-none bg-transparent text-zinc-800 outline-none placeholder:text-zinc-400/60"
          style={{ fontSize: element.fontSize }}
          placeholder="Type something…"
        />
      ) : (
        <p
          className="flex-1 select-none overflow-hidden text-zinc-800"
          style={{ fontSize: element.fontSize }}
        >
          {element.content || (
            <span className="text-zinc-400/60">Double-click to edit</span>
          )}
        </p>
      )}
    </div>
  );
}
