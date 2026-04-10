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
    height: element.size.height,
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
      case "line":
        return (
          <svg
            width={element.size.width}
            height={element.size.height}
            viewBox={`0 0 ${element.size.width} ${element.size.height}`}
            className="pointer-events-none"
          >
            <polyline
              points={element.points.map((p: any) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {element.endEndStyle === "arrow" && element.points.length >= 2 && (
              <polygon
                points={(() => {
                  const last = element.points[element.points.length - 1];
                  const prev = element.points[element.points.length - 2];
                  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
                  const size = 10;
                  const p1x = last.x - size * Math.cos(angle - 0.4);
                  const p1y = last.y - size * Math.sin(angle - 0.4);
                  const p2x = last.x - size * Math.cos(angle + 0.4);
                  const p2y = last.y - size * Math.sin(angle + 0.4);
                  return `${last.x},${last.y} ${p1x},${p1y} ${p2x},${p2y}`;
                })()}
                fill={element.strokeColor}
              />
            )}
          </svg>
        );
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
          <div className="resize-handle -right-1.5 -top-1.5 cursor-ne-resize" />
          <div className="resize-handle -left-1.5 -top-1.5 cursor-nw-resize" />
          <div className="resize-handle -bottom-1.5 -right-1.5 cursor-se-resize" />
          <div className="resize-handle -bottom-1.5 -left-1.5 cursor-sw-resize" />
        </>
      )}
    </div>
  );
}
