"use client";

import React, { useRef, useEffect } from "react";
import type { StickyNoteElement } from "@whiteboard/types";

const STICKY_COLORS: Record<string, string> = {
  yellow: "#fff9c4",
  "yellow-dark": "#ffe082",
  orange: "#ffe0b2",
  coral: "#ff8a80",
  pink: "#f8bbd0",
  "pink-dark": "#f48fb1",
  "blue-light": "#bbdefb",
  purple: "#b39ddb",
  cyan: "#80deea",
  blue: "#64b5f6",
  teal: "#80cbc4",
  green: "#66bb6a",
  "lime-light": "#f0f4c3",
  lime: "#c6ff00",
  white: "#ffffff",
  dark: "#424242",
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
  const isDark = element.color === "dark";
  const textColor = isDark ? "#ffffff" : "#27272a";

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
          className="flex-1 resize-none bg-transparent outline-none"
          style={{ fontSize: element.fontSize, color: textColor }}
          placeholder="Type something…"
        />
      ) : (
        <p
          className="flex-1 select-none overflow-hidden"
          style={{ fontSize: element.fontSize, color: textColor }}
        >
          {element.content || (
            <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(113,113,122,0.4)" }}>
              Doppelklick zum Bearbeiten
            </span>
          )}
        </p>
      )}
    </div>
  );
}
