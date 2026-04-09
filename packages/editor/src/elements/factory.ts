import { nanoid } from "nanoid";
import type {
  StickyNoteElement,
  TextElement,
  ShapeElement,
  LineElement,
  ImageElement,
  FrameElement,
  Point,
  StickyColor,
  ShapeType,
  UserId,
} from "@whiteboard/types";

const now = () => Date.now();

export function createStickyNote(
  position: Point,
  createdBy: UserId,
  options?: { color?: StickyColor; content?: string },
): StickyNoteElement {
  return {
    id: nanoid(),
    type: "sticky-note",
    position,
    size: { width: 200, height: 200 },
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    content: options?.content ?? "",
    color: options?.color ?? "yellow",
    fontSize: 16,
  };
}

export function createTextElement(
  position: Point,
  createdBy: UserId,
  options?: { content?: string; fontSize?: number },
): TextElement {
  return {
    id: nanoid(),
    type: "text",
    position,
    size: { width: 300, height: 40 },
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    content: options?.content ?? "Text",
    fontSize: options?.fontSize ?? 20,
    fontFamily: "Inter",
    fontWeight: 400,
    color: "#1a1a1a",
    textAlign: "left",
  };
}

export function createShape(
  position: Point,
  createdBy: UserId,
  options?: { shapeType?: ShapeType; fillColor?: string },
): ShapeElement {
  return {
    id: nanoid(),
    type: "shape",
    position,
    size: { width: 150, height: 150 },
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    shapeType: options?.shapeType ?? "rectangle",
    fillColor: options?.fillColor ?? "#e2e8f0",
    strokeColor: "#64748b",
    strokeWidth: 2,
  };
}

export function createLine(
  points: Point[],
  createdBy: UserId,
): LineElement {
  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));

  return {
    id: nanoid(),
    type: "line",
    position: { x: minX, y: minY },
    size: { width: maxX - minX || 1, height: maxY - minY || 1 },
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    strokeColor: "#1a1a1a",
    strokeWidth: 2,
    startEndStyle: "none",
    endEndStyle: "arrow",
  };
}

export function createImage(
  position: Point,
  createdBy: UserId,
  src: string,
  naturalWidth: number,
  naturalHeight: number,
): ImageElement {
  const maxWidth = 400;
  const scale = Math.min(1, maxWidth / naturalWidth);

  return {
    id: nanoid(),
    type: "image",
    position,
    size: {
      width: naturalWidth * scale,
      height: naturalHeight * scale,
    },
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    src,
    alt: "",
    naturalWidth,
    naturalHeight,
  };
}

export function createFrame(
  position: Point,
  createdBy: UserId,
  options?: { title?: string; width?: number; height?: number },
): FrameElement {
  return {
    id: nanoid(),
    type: "frame",
    position,
    size: {
      width: options?.width ?? 600,
      height: options?.height ?? 400,
    },
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: -1,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    title: options?.title ?? "Frame",
    backgroundColor: "#f8fafc",
    childIds: [],
  };
}
