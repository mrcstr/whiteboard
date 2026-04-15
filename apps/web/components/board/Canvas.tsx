"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { useEditorStore, screenToCanvas, zoomAroundPoint, boundsOverlap } from "@whiteboard/editor";
import { useStorage, useMutation, useMyPresence, useHistory, useStatus } from "@/lib/liveblocks";
import type { BoardElement, Point } from "@whiteboard/types";
import { BoardElementRenderer } from "./BoardElement";
import { SelectionBox } from "./SelectionBox";
import { PdfUploadDialog } from "./PdfUploadDialog";
import { ContextMenu, buildElementActions } from "./ContextMenu";
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
  const drawingRef = useRef<{ elementId: string; startCanvas: Point } | null>(null);

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

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);

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

  const moveSelectedElements = useMutation(
    ({ storage }, ids: string[], delta: Point) => {
      const els = storage.get("elements");
      if (!els) return;
      const now = Date.now();
      for (const id of ids) {
        const current = (els as any).get(id);
        if (current && !current.locked) {
          (els as any).set(id, {
            ...current,
            position: {
              x: current.position.x + delta.x,
              y: current.position.y + delta.y,
            },
            updatedAt: now,
          });
        }
      }
    },
    [],
  );

  const moveFrameWithChildren = useMutation(
    ({ storage }, frameId: string, delta: Point) => {
      const els = storage.get("elements");
      if (!els) return;
      const now = Date.now();

      const frame = (els as any).get(frameId);
      if (!frame) return;

      // Frame bounds before move
      const fx = frame.position.x;
      const fy = frame.position.y;
      const fw = frame.size.width;
      const fh = frame.size.height;

      // Collect all element IDs to move (frame + children inside)
      const idsToMove: string[] = [frameId];

      // Check all elements: is their center inside the frame?
      const allKeys: string[] = typeof (els as any).keys === "function"
        ? Array.from((els as any).keys()) as string[]
        : Object.keys(els as any);

      for (const id of allKeys) {
        if (id === frameId) continue;
        const el = (els as any).get(id);
        if (!el || el.locked) continue;
        // Center of the element
        const cx = el.position.x + el.size.width / 2;
        const cy = el.position.y + el.size.height / 2;
        if (cx >= fx && cx <= fx + fw && cy >= fy && cy <= fy + fh) {
          idsToMove.push(id);
        }
      }

      // Move all
      for (const id of idsToMove) {
        const current = (els as any).get(id);
        if (current) {
          (els as any).set(id, {
            ...current,
            position: {
              x: current.position.x + delta.x,
              y: current.position.y + delta.y,
            },
            updatedAt: now,
          });
        }
      }
    },
    [],
  );

  // --- Z-Index / Layer mutations ---
  const bringToFront = useMutation(
    ({ storage }, id: string) => {
      const els = storage.get("elements");
      if (!els) return;
      let maxZ = 0;
      const allKeys: string[] = typeof (els as any).keys === "function"
        ? Array.from((els as any).keys()) as string[]
        : Object.keys(els as any);
      for (const k of allKeys) {
        const el = (els as any).get(k);
        if (el?.zIndex > maxZ) maxZ = el.zIndex;
      }
      const current = (els as any).get(id);
      if (current) {
        (els as any).set(id, { ...current, zIndex: maxZ + 1, updatedAt: Date.now() });
      }
    },
    [],
  );

  const sendToBack = useMutation(
    ({ storage }, id: string) => {
      const els = storage.get("elements");
      if (!els) return;
      let minZ = 0;
      const allKeys: string[] = typeof (els as any).keys === "function"
        ? Array.from((els as any).keys()) as string[]
        : Object.keys(els as any);
      for (const k of allKeys) {
        const el = (els as any).get(k);
        if (el?.zIndex < minZ) minZ = el.zIndex;
      }
      const current = (els as any).get(id);
      if (current) {
        (els as any).set(id, { ...current, zIndex: minZ - 1, updatedAt: Date.now() });
      }
    },
    [],
  );

  const bringForward = useMutation(
    ({ storage }, id: string) => {
      const els = storage.get("elements");
      if (!els) return;
      const current = (els as any).get(id);
      if (current) {
        (els as any).set(id, { ...current, zIndex: (current.zIndex ?? 0) + 1, updatedAt: Date.now() });
      }
    },
    [],
  );

  const sendBackward = useMutation(
    ({ storage }, id: string) => {
      const els = storage.get("elements");
      if (!els) return;
      const current = (els as any).get(id);
      if (current) {
        (els as any).set(id, { ...current, zIndex: (current.zIndex ?? 0) - 1, updatedAt: Date.now() });
      }
    },
    [],
  );

  const duplicateElement = useMutation(
    ({ storage }, id: string) => {
      const els = storage.get("elements");
      const order = storage.get("elementOrder");
      if (!els || !order) return;
      const current = (els as any).get(id);
      if (!current) return;
      const newId = id + "-copy-" + Date.now();
      const copy = {
        ...current,
        id: newId,
        position: {
          x: current.position.x + 20,
          y: current.position.y + 20,
        },
        zIndex: (current.zIndex ?? 0) + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      (els as any).set(newId, copy);
      (order as any).push(newId);
    },
    [],
  );

  const toggleLock = useMutation(
    ({ storage }, id: string) => {
      const els = storage.get("elements");
      if (!els) return;
      const current = (els as any).get(id);
      if (current) {
        (els as any).set(id, { ...current, locked: !current.locked, updatedAt: Date.now() });
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

      // Drag-to-draw for shapes and frames
      if (drawingRef.current) {
        const start = drawingRef.current.startCanvas;
        const x = Math.min(start.x, canvasPoint.x);
        const y = Math.min(start.y, canvasPoint.y);
        const w = Math.abs(canvasPoint.x - start.x);
        const h = Math.abs(canvasPoint.y - start.y);
        updateElement(drawingRef.current.elementId, {
          position: { x, y },
          size: { width: Math.max(w, 1), height: Math.max(h, 1) },
        } as any);
      }
    },
    [camera, setCamera, activeTool, selectedIds.length, updateMyPresence, setSelectionBox, updateElement],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isReady) return;
      setContextMenu(null);

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
          // Override size to 1x1 — will be resized during drag
          shape.size = { width: 1, height: 1 };
          history.pause();
          addElement(shape);
          drawingRef.current = { elementId: shape.id, startCanvas: canvasPoint };
          setSelectedIds([shape.id]);
          return;
        }
        case "frame": {
          const frame = createFrame(canvasPoint, userId, {
            width: 1,
            height: 1,
          });
          history.pause();
          addElement(frame);
          drawingRef.current = { elementId: frame.id, startCanvas: canvasPoint };
          setSelectedIds([frame.id]);
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
        .filter(Boolean)
        .sort((a: BoardElement, b: BoardElement) => (a.zIndex ?? 0) - (b.zIndex ?? 0)) as BoardElement[];
    } catch {
      return [];
    }
  }, [elements, elementOrder]);

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false;

    // Finalize drag-to-draw
    if (drawingRef.current) {
      const id = drawingRef.current.elementId;
      const el = sortedElements.find((e) => e.id === id);
      // If barely dragged, give a default size
      if (el && el.size.width < 10 && el.size.height < 10) {
        const defaultSize = el.type === "frame"
          ? { width: 600, height: 400 }
          : { width: 150, height: 150 };
        updateElement(id, { size: defaultSize } as any);
      }
      history.resume();
      drawingRef.current = null;
      setActiveTool("select");
    }

    // Rubber-band selection: find elements inside the selection box
    if (selectionBox && dragStartRef.current) {
      const box = selectionBox;
      // Convert screen-space box to canvas coordinates
      const topLeft = screenToCanvas({ x: box.x, y: box.y }, camera);
      const bottomRight = screenToCanvas(
        { x: box.x + box.width, y: box.y + box.height },
        camera,
      );
      const canvasBounds = {
        x: Math.min(topLeft.x, bottomRight.x),
        y: Math.min(topLeft.y, bottomRight.y),
        width: Math.abs(bottomRight.x - topLeft.x),
        height: Math.abs(bottomRight.y - topLeft.y),
      };

      // Only select if the box has meaningful size (not just a click)
      if (canvasBounds.width > 5 || canvasBounds.height > 5) {
        const hitIds = sortedElements
          .filter((el) =>
            boundsOverlap(canvasBounds, {
              x: el.position.x,
              y: el.position.y,
              width: el.size.width,
              height: el.size.height,
            }),
          )
          .map((el) => el.id);

        if (hitIds.length > 0) {
          setSelectedIds(hitIds);
        }
      }
    }

    dragStartRef.current = null;
    setSelectionBox(null);
  }, [selectionBox, camera, sortedElements, setSelectedIds, setSelectionBox, updateElement, history, setActiveTool]);

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
              const store = useEditorStore.getState();
              if (multi) {
                if (store.selectedIds.includes(id)) {
                  store.removeFromSelection(id);
                } else {
                  store.addToSelection(id);
                }
              } else if (!store.selectedIds.includes(id)) {
                store.setSelectedIds([id]);
              }
            }}
            onMove={(id, pos) => moveElement(id, pos)}
            onMoveMultiple={(ids, delta) => moveSelectedElements(ids, delta)}
            onMoveFrame={(frameId, delta) => moveFrameWithChildren(frameId, delta)}
            onUpdate={(id, updates) => updateElement(id, updates)}
            onContextMenu={(e, id) => {
              setContextMenu({ x: e.clientX, y: e.clientY, elementId: id });
              const store = useEditorStore.getState();
              if (!store.selectedIds.includes(id)) {
                store.setSelectedIds([id]);
              }
            }}
          />
        ))}
      </div>

      {selectionBox && <SelectionBox bounds={selectionBox} />}

      <div className="absolute bottom-4 right-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm backdrop-blur-sm">
        {Math.round(camera.zoom * 100)}%
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const targetEl = sortedElements.find((el) => el.id === contextMenu.elementId);
        if (!targetEl) return null;
        const maxZ = Math.max(0, ...sortedElements.map((el) => el.zIndex ?? 0));
        const minZ = Math.min(0, ...sortedElements.map((el) => el.zIndex ?? 0));
        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            actions={buildElementActions({
              onBringToFront: () => {
                const newZ = maxZ + 1;
                console.log("BRING TO FRONT", contextMenu.elementId, "currentZ:", targetEl.zIndex, "newZ:", newZ, "maxZ:", maxZ);
                updateElement(contextMenu.elementId, { zIndex: newZ } as any);
              },
              onBringForward: () => {
                const newZ = (targetEl.zIndex ?? 0) + 1;
                console.log("BRING FORWARD", contextMenu.elementId, "currentZ:", targetEl.zIndex, "newZ:", newZ);
                updateElement(contextMenu.elementId, { zIndex: newZ } as any);
              },
              onSendBackward: () => {
                const newZ = (targetEl.zIndex ?? 0) - 1;
                console.log("SEND BACKWARD", contextMenu.elementId, "currentZ:", targetEl.zIndex, "newZ:", newZ);
                updateElement(contextMenu.elementId, { zIndex: newZ } as any);
              },
              onSendToBack: () => {
                const newZ = minZ - 1;
                console.log("SEND TO BACK", contextMenu.elementId, "currentZ:", targetEl.zIndex, "newZ:", newZ, "minZ:", minZ);
                updateElement(contextMenu.elementId, { zIndex: newZ } as any);
              },
              onDuplicate: () => duplicateElement(contextMenu.elementId),
              onToggleLock: () => toggleLock(contextMenu.elementId),
              onDelete: () => {
                deleteElements([contextMenu.elementId]);
                clearSelection();
              },
              isLocked: targetEl.locked,
            })}
          />
        );
      })()}

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