"use client";

import { useEffect } from "react";
import { useEditorStore } from "@whiteboard/editor";
import { useUndo, useRedo } from "@/lib/liveblocks";
import type { ToolType } from "@whiteboard/types";

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: "select",
  h: "hand",
  n: "sticky-note",
  t: "text",
  s: "shape",
  l: "line",
  i: "image",
  f: "frame",
  e: "eraser",
};

export function useKeyboardShortcuts() {
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const camera = useEditorStore((s) => s.camera);
  const setCamera = useEditorStore((s) => s.setCamera);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const undo = useUndo();
  const redo = useRedo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const cmd = e.metaKey || e.ctrlKey;

      // Undo / Redo
      if (cmd && key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (cmd && key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Zoom shortcuts
      if (cmd && (key === "=" || key === "+")) {
        e.preventDefault();
        setCamera({ ...camera, zoom: Math.min(camera.zoom * 1.2, 5) });
        return;
      }
      if (cmd && key === "-") {
        e.preventDefault();
        setCamera({ ...camera, zoom: Math.max(camera.zoom / 1.2, 0.1) });
        return;
      }
      if (cmd && key === "0") {
        e.preventDefault();
        setCamera({ x: 0, y: 0, zoom: 1 });
        return;
      }

      // Escape → deselect
      if (key === "escape") {
        clearSelection();
        setActiveTool("select");
        return;
      }

      // Tool shortcuts (single key, no modifier)
      if (!cmd && !e.altKey && TOOL_SHORTCUTS[key]) {
        setActiveTool(TOOL_SHORTCUTS[key]);
        return;
      }

      // Space → temporarily switch to hand tool
      if (key === " " && !cmd) {
        e.preventDefault();
        setActiveTool("hand");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setActiveTool("select");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setActiveTool, camera, setCamera, clearSelection, undo, redo]);
}
