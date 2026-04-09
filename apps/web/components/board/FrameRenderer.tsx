"use client";

import React, { useRef, useEffect } from "react";
import type { FrameElement } from "@whiteboard/types";

interface Props {
  element: FrameElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<FrameElement>) => void;
  onStopEditing: () => void;
}

export function FrameRenderer({ element, isEditing, onUpdate, onStopEditing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className="relative h-full w-full rounded-lg border-2 border-dashed border-zinc-300"
      style={{ backgroundColor: element.backgroundColor }}
    >
      {/* Frame title */}
      <div className="absolute -top-7 left-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={element.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onBlur={onStopEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") onStopEditing();
            }}
            className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-zinc-600 outline-none ring-1 ring-zinc-300"
          />
        ) : (
          <span className="select-none rounded px-2 py-0.5 text-xs font-semibold text-zinc-500">
            {element.title}
          </span>
        )}
      </div>
    </div>
  );
}
