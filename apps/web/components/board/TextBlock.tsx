"use client";

import React, { useRef, useEffect } from "react";
import type { TextElement } from "@whiteboard/types";

interface Props {
  element: TextElement;
  isEditing: boolean;
  onUpdate: (updates: Partial<TextElement>) => void;
  onStopEditing: () => void;
}

export function TextBlock({ element, isEditing, onUpdate, onStopEditing }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={element.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        onBlur={onStopEditing}
        onKeyDown={(e) => {
          if (e.key === "Escape") onStopEditing();
        }}
        className="h-full w-full resize-none bg-transparent outline-none"
        style={{
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          color: element.color,
          textAlign: element.textAlign,
        }}
      />
    );
  }

  return (
    <div
      className="h-full w-full select-none overflow-hidden"
      style={{
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        color: element.color,
        textAlign: element.textAlign,
      }}
    >
      {element.content || (
        <span className="text-zinc-300">Double-click to edit</span>
      )}
    </div>
  );
}
