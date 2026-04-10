"use client";

import React, { useCallback, useRef, useState } from "react";
import type { BoardElement, Point } from "@whiteboard/types";
import { useEditorStore, screenToCanvas } from "@whiteboard/editor";
import { StickyNote } from "./StickyNote";
import { ShapeRenderer } from "./ShapeRenderer";
import { TextBlock } from "./TextBlock";
import { FrameRenderer } from "./FrameRenderer";

interface Props {
  element: BoardElement;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onMove: (id: string, position: Point) => void;
  onUpdate: (id: string, updates: Partial<BoardElement>) => void;
}

export function BoardElementRenderer({
  element,
  isSelected,
  onSelect,
  onMove,
  onUpdate,
}: Props) {
  const camera = useEditorStore((s) => s.camera);
  const editingId = useEditorStore((s) => s.editingElementId);
  const setEditingId = useEditorStore((s) => s.setEditingElementId);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  const isEditing = editingId === element.id;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (element.locked) return;
      e.stopPropagation();

      onSelect(element.id, e.shiftKey);

      // Start dragging
      const canvasPoint = screenToCanvas(
        { x: e.clientX, y: e.clientY },
        camera,
      );
      dragOffsetRef.current = {
        x: canvasPoint.x - element.position.x,
        y: canvasPoint.y - element.position.y,
      };
      isDraggingRef.current = true;

      const onPointerMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const newCanvas = screenToCanvas(
          { x: ev.clientX, y: ev.clientY },
          camera,
        );
        onMove(element.id, {
          x: newCanvas.x - dragOffsetRef.current.x,
          y: newCanvas.y - dragOffsetRef.current.y,
        });
      };

      const onPointerUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [element, camera, onSelect, onMove],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (
        element.type === "sticky-note" ||
        element.type === "text" ||
        element.type === "frame"
      ) {
        setEditingId(element.id);
      }
    },
    [element, setEditingId],
  );

  const style: React.CSSProperties = {
    position: "absolute",
    left: element.position.x,
    top: element.position.y,
    width: element.size.width,
    height: element.type === "line" ? Math.max(element.size.height, 20) : element.size.height,
    overflow: element.type === "line" ? "visible" : undefined,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    opacity: element.opacity,
    zIndex: element.zIndex,
    cursor: element.locked ? "default" : "move",
  };

  const renderInner = () => {
    switch (element.type) {
      case "sticky-note":
        return (
          <StickyNote
            element={element}
            isEditing={isEditing}
            onUpdate={(updates) => onUpdate(element.id, updates)}
            onStopEditing={() => setEditingId(null)}
          />
        );
      case "text":
        return (
          <TextBlock
            element={element}
            isEditing={isEditing}
            onUpdate={(updates) => onUpdate(element.id, updates)}
            onStopEditing={() => setEditingId(null)}
          />
        );
      case "shape":
        return <ShapeRenderer element={element} />;
      case "frame":
        return (
          <FrameRenderer
            element={element}
            isEditing={isEditing}
            onUpdate={(updates) => onUpdate(element.id, updates)}
            onStopEditing={() => setEditingId(null)}
          />
        );
      case "line": {
        return (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 100 100`}
            preserveAspectRatio="none"
            className="pointer-events-none overflow-visible"
            style={{ position: "absolute", inset: 0 }}
          >
            <line
              x1={0}
              y1={50}
              x2={100}
              y2={50}
              stroke={element.strokeColor || "#1a1a1a"}
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
            {element.endEndStyle === "arrow" && (
              <polygon
                points="95,45 100,50 95,55"
                fill={element.strokeColor || "#1a1a1a"}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        );
      }
      case "image":
        return (
          <img
            src={element.src}
            alt={element.alt}
            className="h-full w-full rounded object-cover"
            draggable={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      className={isSelected ? "element-selected" : ""}
    >
      {renderInner()}

      {/* Resize handles */}
      {isSelected && !element.locked && (
        <>
          {["nw", "ne", "se", "sw"].map((corner) => {
            const posStyle: React.CSSProperties =
              corner === "nw" ? { left: -6, top: -6, cursor: "nw-resize" }
              : corner === "ne" ? { right: -6, top: -6, cursor: "ne-resize" }
              : corner === "se" ? { right: -6, bottom: -6, cursor: "se-resize" }
              : { left: -6, bottom: -6, cursor: "sw-resize" };

            return (
              <div
                key={corner}
                className="resize-handle"
                style={posStyle}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startW = element.size.width;
                  const startH = element.size.height;
                  const startPos = { ...element.position };
                  const zoom = camera.zoom;

                  const onMove = (ev: PointerEvent) => {
                    const dx = (ev.clientX - startX) / zoom;
                    const dy = (ev.clientY - startY) / zoom;

                    let newX = startPos.x;
                    let newY = startPos.y;
                    let newW = startW;
                    let newH = startH;

                    if (corner.includes("e")) newW = Math.max(20, startW + dx);
                    if (corner.includes("w")) { newW = Math.max(20, startW - dx); newX = startPos.x + (startW - newW); }
                    if (corner.includes("s")) newH = Math.max(20, startH + dy);
                    if (corner.includes("n")) { newH = Math.max(20, startH - dy); newY = startPos.y + (startH - newH); }

                    onUpdate(element.id, {
                      position: { x: newX, y: newY },
                      size: { width: newW, height: newH },
                    } as any);
                  };

                  const onUp = () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };

                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}
