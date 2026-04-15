"use client";

import React, { useState } from "react";
import { useEditorStore } from "@whiteboard/editor";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@/lib/liveblocks";
import { Tooltip } from "@whiteboard/ui";
import type { ToolType, ShapeType, StickyColor } from "@whiteboard/types";
import {
  MousePointer2,
  Hand,
  StickyNote,
  Type,
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
  Minus,
  Image,
  Frame,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface ToolButton {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const TOOLS: ToolButton[] = [
  { tool: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select", shortcut: "V" },
  { tool: "hand", icon: <Hand className="h-4 w-4" />, label: "Hand", shortcut: "H" },
  { tool: "sticky-note", icon: <StickyNote className="h-4 w-4" />, label: "Sticky Note", shortcut: "N" },
  { tool: "text", icon: <Type className="h-4 w-4" />, label: "Text", shortcut: "T" },
  { tool: "shape", icon: <Square className="h-4 w-4" />, label: "Shape", shortcut: "S" },
  { tool: "line", icon: <Minus className="h-4 w-4" />, label: "Line", shortcut: "L" },
  { tool: "image", icon: <Image className="h-4 w-4" />, label: "Image", shortcut: "I" },
  { tool: "frame", icon: <Frame className="h-4 w-4" />, label: "Frame", shortcut: "F" },
  { tool: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser", shortcut: "E" },
];

const SHAPE_OPTIONS: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
  { type: "rectangle", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
  { type: "ellipse", icon: <Circle className="h-4 w-4" />, label: "Ellipse" },
  { type: "triangle", icon: <Triangle className="h-4 w-4" />, label: "Triangle" },
  { type: "diamond", icon: <Diamond className="h-4 w-4" />, label: "Diamond" },
  { type: "star", icon: <Star className="h-4 w-4" />, label: "Star" },
];

const STICKY_COLORS: { color: StickyColor; hex: string }[] = [
  { color: "yellow", hex: "#fff9c4" },
  { color: "yellow-dark", hex: "#ffe082" },
  { color: "orange", hex: "#ffe0b2" },
  { color: "coral", hex: "#ff8a80" },
  { color: "pink", hex: "#f8bbd0" },
  { color: "pink-dark", hex: "#f48fb1" },
  { color: "blue-light", hex: "#bbdefb" },
  { color: "purple", hex: "#b39ddb" },
  { color: "cyan", hex: "#80deea" },
  { color: "blue", hex: "#64b5f6" },
  { color: "teal", hex: "#80cbc4" },
  { color: "green", hex: "#66bb6a" },
  { color: "lime-light", hex: "#f0f4c3" },
  { color: "lime", hex: "#c6ff00" },
  { color: "white", hex: "#ffffff" },
  { color: "dark", hex: "#424242" },
];

export function Toolbar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const activeShapeType = useEditorStore((s) => s.activeShapeType);
  const setActiveShapeType = useEditorStore((s) => s.setActiveShapeType);
  const activeStickyColor = useEditorStore((s) => s.activeStickyColor);
  const setActiveStickyColor = useEditorStore((s) => s.setActiveStickyColor);
  const camera = useEditorStore((s) => s.camera);
  const setCamera = useEditorStore((s) => s.setCamera);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleToolClick = (tool: ToolType) => {
    if (tool === "shape") {
      if (activeTool === "shape") {
        setShowShapePicker(!showShapePicker);
      } else {
        setActiveTool(tool);
        setShowShapePicker(true);
      }
      setShowColorPicker(false);
      return;
    }
    if (tool === "sticky-note") {
      if (activeTool === "sticky-note") {
        setShowColorPicker(!showColorPicker);
      } else {
        setActiveTool(tool);
        setShowColorPicker(true);
      }
      setShowShapePicker(false);
      return;
    }
    setActiveTool(tool);
    setShowShapePicker(false);
    setShowColorPicker(false);
  };

  const zoomIn = () => {
    setCamera({ ...camera, zoom: Math.min(camera.zoom * 1.2, 5) });
  };

  const zoomOut = () => {
    setCamera({ ...camera, zoom: Math.max(camera.zoom / 1.2, 0.1) });
  };

  const resetZoom = () => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <>
      {/* Main toolbar */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl border bg-white/95 px-2 py-2 shadow-lg backdrop-blur-md">
        {TOOLS.map((t) => (
          <Tooltip key={t.tool} content={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}>
            <button
              onClick={() => handleToolClick(t.tool)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                activeTool === t.tool
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {t.icon}
            </button>
          </Tooltip>
        ))}

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-zinc-200" />

        {/* Undo / Redo */}
        <Tooltip content="Undo (⌘Z)">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </Tooltip>
        <Tooltip content="Redo (⌘⇧Z)">
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* Shape picker popup */}
      {showShapePicker && activeTool === "shape" && (
        <div className="absolute bottom-[88px] left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-xl border bg-white p-2 shadow-lg animate-scale-in">
          {SHAPE_OPTIONS.map((s) => (
            <Tooltip key={s.type} content={s.label} side="top">
              <button
                onClick={() => {
                  setActiveShapeType(s.type);
                  setShowShapePicker(false);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  activeShapeType === s.type
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {s.icon}
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Sticky color picker popup */}
      {showColorPicker && activeTool === "sticky-note" && (
        <div className="absolute bottom-[88px] left-1/2 z-30 -translate-x-1/2 rounded-xl border bg-white p-2.5 shadow-lg animate-scale-in">
          <div className="grid grid-cols-2 gap-1.5">
            {STICKY_COLORS.map((c) => (
              <button
                key={c.color}
                onClick={() => {
                  setActiveStickyColor(c.color);
                  setShowColorPicker(false);
                }}
                className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                  activeStickyColor === c.color
                    ? "border-zinc-800 scale-110"
                    : c.color === "white"
                      ? "border-zinc-200"
                      : "border-transparent"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-4 z-20 flex items-center gap-1 rounded-xl border bg-white/95 p-1 shadow-sm backdrop-blur-md">
        <button
          onClick={zoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={resetZoom}
          className="flex h-8 min-w-[48px] items-center justify-center rounded-lg px-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        >
          {Math.round(camera.zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}
