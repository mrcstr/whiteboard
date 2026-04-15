"use client";

import React, { useCallback, useRef, useMemo } from "react";
import { useEditorStore } from "@whiteboard/editor";
import { useStorage } from "@/lib/liveblocks";
import type { BoardElement } from "@whiteboard/types";

/** Color mapping for element types */
const ELEMENT_COLORS: Record<string, string> = {
  "sticky-note": "#fde68a",
  text: "#a1a1aa",
  shape: "#93c5fd",
  line: "#6b7280",
  image: "#c4b5fd",
  frame: "#d1d5db",
};

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

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const PADDING = 40;

export function Minimap() {
  const minimapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const camera = useEditorStore((s) => s.camera);
  const setCamera = useEditorStore((s) => s.setCamera);

  const elements = useStorage((root) => root.elements);
  const elementOrder = useStorage((root) => root.elementOrder);

  // Collect all elements into an array
  const allElements: BoardElement[] = useMemo(() => {
    if (!elements || !elementOrder) return [];
    try {
      const order =
        typeof (elementOrder as any).toArray === "function"
          ? (elementOrder as any).toArray()
          : Array.from(elementOrder as any);
      return order
        .map((id: string) => {
          const el =
            typeof (elements as any).get === "function"
              ? (elements as any).get(id)
              : (elements as any)[id];
          return el;
        })
        .filter(Boolean) as BoardElement[];
    } catch {
      return [];
    }
  }, [elements, elementOrder]);

  // Calculate the world bounding box enclosing all elements
  const worldBounds = useMemo(() => {
    if (allElements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of allElements) {
      minX = Math.min(minX, el.position.x);
      minY = Math.min(minY, el.position.y);
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    }

    // Add padding
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [allElements]);

  // Calculate the viewport rectangle in canvas coordinates
  const viewport = useMemo(() => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    return {
      x: -camera.x / camera.zoom,
      y: -camera.y / camera.zoom,
      width: vw / camera.zoom,
      height: vh / camera.zoom,
    };
  }, [camera]);

  // Combined bounds: union of world elements + current viewport
  const combinedBounds = useMemo(() => {
    const vp = viewport;
    if (!worldBounds) {
      return {
        minX: vp.x - PADDING,
        minY: vp.y - PADDING,
        maxX: vp.x + vp.width + PADDING,
        maxY: vp.y + vp.height + PADDING,
        width: vp.width + PADDING * 2,
        height: vp.height + PADDING * 2,
      };
    }

    const minX = Math.min(worldBounds.minX, vp.x);
    const minY = Math.min(worldBounds.minY, vp.y);
    const maxX = Math.max(worldBounds.maxX, vp.x + vp.width);
    const maxY = Math.max(worldBounds.maxY, vp.y + vp.height);

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [worldBounds, viewport]);

  // Scale factor to fit combined bounds into the minimap
  const scale = useMemo(() => {
    if (combinedBounds.width === 0 || combinedBounds.height === 0) return 1;
    return Math.min(
      MINIMAP_WIDTH / combinedBounds.width,
      MINIMAP_HEIGHT / combinedBounds.height,
    );
  }, [combinedBounds]);

  // Convert canvas coordinate to minimap pixel
  const toMinimap = useCallback(
    (cx: number, cy: number) => ({
      x: (cx - combinedBounds.minX) * scale,
      y: (cy - combinedBounds.minY) * scale,
    }),
    [combinedBounds, scale],
  );

  // Navigate camera to a canvas point (center the viewport on it)
  const navigateTo = useCallback(
    (minimapX: number, minimapY: number) => {
      const rect = minimapRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Convert minimap pixel to canvas coordinate
      const canvasX = minimapX / scale + combinedBounds.minX;
      const canvasY = minimapY / scale + combinedBounds.minY;

      // Center viewport on that canvas point
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      setCamera({
        x: -canvasX * camera.zoom + vw / 2,
        y: -canvasY * camera.zoom + vh / 2,
        zoom: camera.zoom,
      });
    },
    [scale, combinedBounds, camera.zoom, setCamera],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingRef.current = true;

      const rect = minimapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      navigateTo(mx, my);

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [navigateTo],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;

      const rect = minimapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      navigateTo(mx, my);
    },
    [navigateTo],
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Get color for an element
  const getColor = (el: BoardElement) => {
    if (el.type === "sticky-note" && "color" in el) {
      return STICKY_COLORS[el.color] ?? ELEMENT_COLORS["sticky-note"];
    }
    return ELEMENT_COLORS[el.type] ?? "#d4d4d8";
  };

  // Viewport rect in minimap coordinates
  const vpMinimap = toMinimap(viewport.x, viewport.y);
  const vpW = viewport.width * scale;
  const vpH = viewport.height * scale;

  return (
    <div className="absolute bottom-[68px] left-4 z-20 select-none">
      <div
        ref={minimapRef}
        className="overflow-hidden rounded-lg border border-zinc-200 bg-white/95 shadow-sm backdrop-blur-md"
        style={{
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
          cursor: "crosshair",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Background dot pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "#fafaf9",
            backgroundImage: "radial-gradient(circle, #e7e5e4 0.5px, transparent 0.5px)",
            backgroundSize: `${Math.max(4, 24 * scale)}px ${Math.max(4, 24 * scale)}px`,
          }}
        />

        {/* Elements */}
        <svg
          className="absolute inset-0"
          width={MINIMAP_WIDTH}
          height={MINIMAP_HEIGHT}
          style={{ overflow: "visible" }}
        >
          {allElements.map((el) => {
            const pos = toMinimap(el.position.x, el.position.y);
            const w = Math.max(2, el.size.width * scale);
            const h = Math.max(2, el.size.height * scale);

            if (el.type === "line") {
              return (
                <line
                  key={el.id}
                  x1={pos.x}
                  y1={pos.y + h / 2}
                  x2={pos.x + w}
                  y2={pos.y + h / 2}
                  stroke={getColor(el)}
                  strokeWidth={Math.max(1, 2 * scale)}
                  strokeLinecap="round"
                />
              );
            }

            return (
              <rect
                key={el.id}
                x={pos.x}
                y={pos.y}
                width={w}
                height={h}
                rx={el.type === "sticky-note" ? 1 : 0.5}
                fill={getColor(el)}
                opacity={el.type === "frame" ? 0.3 : 0.85}
                stroke={el.type === "frame" ? "#9ca3af" : "none"}
                strokeWidth={el.type === "frame" ? 0.5 : 0}
              />
            );
          })}

          {/* Viewport rectangle */}
          <rect
            x={vpMinimap.x}
            y={vpMinimap.y}
            width={Math.max(8, vpW)}
            height={Math.max(6, vpH)}
            fill="rgba(59, 130, 246, 0.08)"
            stroke="#3b82f6"
            strokeWidth={1.5}
            rx={1}
          />
        </svg>
      </div>
    </div>
  );
}
