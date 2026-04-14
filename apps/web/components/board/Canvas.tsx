"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { useEditorStore, screenToCanvas, zoomAroundPoint } from "@whiteboard/editor";
import { useStorage, useMutation, useMyPresence, useHistory, useStatus } from "@/lib/liveblocks";
import type { BoardElement, Point } from "@whiteboard/types";
import { BoardElementRenderer } from "./BoardElement";
import { SelectionBox } from "./SelectionBox";
import { PdfUploadDialog } from "./PdfUploadDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Loader2 } from "lucide-react";
import {
  createStickyNote,
  createTextElement,
  createShape,
  createFrame,
  createLine,
  createImage,
} from "@whiteboard/editor";

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Point | null>(null);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<Point>({ x: 0, y: 0 });

  const camera = useEditorStore((s) => s.camera);
  const setCamera = useEditorStore((s) => s.setCamera);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const selectionBox = useEditorStore((s) => s.selectionBox);
  const setSelectionBox = useEditorStore((s) => s.setSelectionBox);
  const activeShapeType = useEditorStore((s) => s.activeShapeType);
  const activeStickyColor = useEditorStore((s) => s.activeStickyColor);

  const [myPresence, updateMyPresence] = useMyPresence();
  const history = useHistory();
  const status = useStatus();

  // PDF upload dialog
  const [showPdfUpload, setShowPdfUpload] = useState(false);

  // Show PDF dialog when image tool is selected
  useEffect(() => {
    if (activeTool === "image") {
      setShowPdfUpload(true);
    }
  }, [activeTool]);

  // Get elements from Liveblocks storage
  const elements = useStorage((root) => root.elements);
  const elementOrder = useStorage((root) => root.elementOrder);

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Check if storage is ready
  const isReady = status === "connected" && elements !== null && elementOrder !== null;

  // --- Mutations (write to shared storage) ---
  const addElement = useMutation(
    ({ storage }, element: BoardElement) => {
      const els = storage.get("elements");
      const order = storage.get("elementOrder");
      if (!els || !order) return;
      (els as any).set(element.id, element);
      (order as any).push(element.id);
    },
    [],
  );

  const deleteElements = useMutation(
    ({ storage }, ids: string[]) => {
      const els = storage.get("elements");
      const order = storage.get("elementOrder");
      if (!els || !order) return;
      for (const id of ids) {
        (els as any).delete(id);
        const idx = (order as any).indexOf(id);
        if (idx !== -1) (order as any).delete(idx);
      }
    },
    [],
  );

  const updateElement = useMutation(
    ({ storage }, id: string, updates: Partial<BoardElement>) => {
      const els = storage.get("elements");
      if (!els) return;
      const current = (els as any).get(id);
      if (current) {
        (els as any).set(id, { ...current, ...updates, updatedAt: Date.now() });
      }
    },
    [],
  );

  const moveElement = useMutation(
    ({ storage }, id: string, position: Point) => {
      const els = storage.get("elements");
      if (!els) return;
      const current = (els as any).get(id);
      if (current) {
        (els as any).set(id, { ...current, position, updatedAt: Date.now() });
      }
    },
    [],
  );

  // --- PDF image placement ---
  const handlePdfImages = useCallback(
    (images: { src: string; naturalWidth: number; naturalHeight: number; page: number }[]) => {
      const userId = "current-user";
      // Calculate canvas center for placement
      const containerRect = canvasRef.current?.getBoundingClientRect();
      const centerScreen: Point = {
        x: (containerRect?.width ?? window.innerWidth) / 2,
        y: (containerRect?.height ?? window.innerHeight) / 2,
      };
      const centerCanvas = screenToCanvas(centerScreen, camera);

      const GAP = 24;
      const TARGET_WIDTH = 200;
      const cols = Math.min(6, Math.ceil(Math.sqrt(images.length)));

      history.pause();

      const newIds: string[] = [];
      images.forEach((img, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const position: Point = {
          x: centerCanvas.x - ((cols * (TARGET_WIDTH + GAP)) / 2) + col * (TARGET_WIDTH + GAP),
          y: centerCanvas.y - 100 + row * (TARGET_WIDTH + GAP),
        };

        const element = createImage(
          position,
          userId,
          img.src,
          img.naturalWidth,
          img.naturalHeight,
        );

        addElement(element);
        newIds.push(element.id);
      });

      history.resume();

      if (newIds.length > 0) {
        setSelectedIds(newIds);
      }
      setActiveTool("select");
    },
    [camera, addElement, history, setSelectedIds, setActiveTool],
  );

  // --- Pointer Handlers ---
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const point = { x: e.clientX, y: e.clientY };
      const canvasPoint = screenToCanvas(point, camera);

      updateMyPresence({ cursor: canvasPoint });
      lastPointerRef.current = point;

      if (isPanningRef.current && dragStartRef.current) {
        const dx = point.x - dragStartRef.current.x;
        const dy = point.y - dragStartRef.current.y;
        setCamera({
          ...camera,
          x: camera.x + dx,
          y: camera.y + dy,
        });
        dragStartRef.current = point;
        return;
      }

      if (activeTool === "select" && dragStartRef.current && selectedIds.length === 0) {
        const start = dragStartRef.current;
        setSelectionBox({
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y),
        });
      }
    },
    [camera, setCamera, activeTool, selectedIds.length, updateMyPresence, setSelectionBox],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isReady) return;

      const point = { x: e.clientX, y: e.clientY };
      const canvasPoint = screenToCanvas(point, camera);

      if (e.button === 1 || activeTool === "hand") {
        isPanningRef.current = true;
        dragStartRef.current = point;
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      if (e.button !== 0) return;

      const userId = "current-user";
      switch (activeTool) {
        case "sticky-note": {
          const note = createStickyNote(canvasPoint, userId, {
            color: activeStickyColor,
          });
          history.pause();
          addElement(note);
          history.resume();
          setSelectedIds([note.id]);
          setActiveTool("select");
          return;
        }
        case "text": {
          const text = createTextElement(canvasPoint, userId);
          history.pause();
          addElement(text);
          history.resume();
          setSelectedIds([text.id]);
          setActiveTool("select");
          return;
        }
        case "shape": {
          const shape = createShape(canvasPoint, userId, {
            shapeType: activeShapeType,
          });
          history.pause();
          addElement(shape);
          history.resume();
          setSelectedIds([shape.id]);
          setActiveTool("select");
          return;
        }
        case "frame": {
          const frame = createFrame(canvasPoint, userId);
          history.pause();
          addElement(frame);
          history.resume();
          setSelectedIds([frame.id]);
          setActiveTool("select");
          return;
        }
        case "line": {
          const line = createLine(
            [canvasPoint, { x: canvasPoint.x + 200, y: canvasPoint.y }],
            userId,
          );
          history.pause();
          addElement(line);
          history.resume();
          setSelectedIds([line.id]);
          setActiveTool("select");
          return;
        }
        case "select": {
          clearSelection();
          dragStartRef.current = point;
          return;
        }
      }
    },
    [
      isReady,
      camera,
      activeTool,
      activeStickyColor,
      activeShapeType,
      addElement,
      clearSelection,
      setSelectedIds,
      setActiveTool,
      history,
    ],
  );

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false;
    dragStartRef.current = null;
    setSelectionBox(null);
  }, [setSelectionBox]);

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const newCamera = zoomAroundPoint(
          camera,
          { x: e.clientX, y: e.clientY },
          e.deltaY,
        );
        setCamera(newCamera);
      } else {
        setCamera({
          ...camera,
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY,
        });
      }
    },
    [camera, setCamera],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        deleteElements(selectedIds);
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, deleteElements, clearSelection]);

  const sortedElements: BoardElement[] = React.useMemo(() => {
    if (!elements || !elementOrder) return [];
    try {
      const order = typeof (elementOrder as any).toArray === "function"
        ? (elementOrder as any).toArray()
        : Array.from(elementOrder as any);
      return order
        .map((id: string) => {
          const el = typeof (elements as any).get === "function"
            ? (elements as any).get(id)
            : (elements as any)[id];
          return el;
        })
        .filter(Boolean) as BoardElement[];
    } catch {
      return [];
    }
  }, [elements, elementOrder]);

  // Loading state
  if (!isReady) {
    return (
      <div className="absolute inset-0 flex items-center justify-center board-canvas">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-500">
            {status === "connected" ? "Loading board…" : `Connecting… (${status})`}
          </span>
        </div>
      </div>
    );
  }

  const cursorStyle =
    activeTool === "hand"
      ? "grab"
      : activeTool === "select"
        ? "default"
        : "crosshair";

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 board-canvas"
      style={{ cursor: cursorStyle }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <div
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {sortedElements.map((element) => (
          <BoardElementRenderer
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            onSelect={(id, multi) => {
              if (multi) {
                useEditorStore.getState().addToSelection(id);
              } else {
                setSelectedIds([id]);
              }
              updateMyPresence({ selectedElementIds: [id] });
            }}
            onMove={(id, pos) => moveElement(id, pos)}
            onUpdate={(id, updates) => updateElement(id, updates)}
          />
        ))}
      </div>

      {selectionBox && <SelectionBox bounds={selectionBox} />}

      <div className="absolute bottom-4 right-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm backdrop-blur-sm">
        {Math.round(camera.zoom * 100)}%
      </div>

      <PdfUploadDialog
        open={showPdfUpload}
        onClose={() => {
          setShowPdfUpload(false);
          setActiveTool("select");
        }}
        onImagesReady={handlePdfImages}
      />
    </div>
  );
}