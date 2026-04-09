import type { Point, Bounds, BoardElement, Camera } from "@whiteboard/types";

/** Convert screen coordinates to canvas coordinates */
export function screenToCanvas(
  screenPoint: Point,
  camera: Camera,
): Point {
  return {
    x: (screenPoint.x - camera.x) / camera.zoom,
    y: (screenPoint.y - camera.y) / camera.zoom,
  };
}

/** Convert canvas coordinates to screen coordinates */
export function canvasToScreen(
  canvasPoint: Point,
  camera: Camera,
): Point {
  return {
    x: canvasPoint.x * camera.zoom + camera.x,
    y: canvasPoint.y * camera.zoom + camera.y,
  };
}

/** Get the bounding box of an element */
export function getElementBounds(element: BoardElement): Bounds {
  return {
    x: element.position.x,
    y: element.position.y,
    width: element.size.width,
    height: element.size.height,
  };
}

/** Check if a point is inside a bounds */
export function pointInBounds(point: Point, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/** Check if two bounds overlap */
export function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Get the bounding box that encloses all given bounds */
export function getEnclosingBounds(boundsList: Bounds[]): Bounds | null {
  if (boundsList.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const b of boundsList) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Clamp zoom level */
export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, 0.1), 5);
}

/** Calculate zoom around a point */
export function zoomAroundPoint(
  camera: Camera,
  point: Point,
  delta: number,
): Camera {
  const zoomFactor = 1 - delta * 0.001;
  const newZoom = clampZoom(camera.zoom * zoomFactor);

  return {
    x: point.x - (point.x - camera.x) * (newZoom / camera.zoom),
    y: point.y - (point.y - camera.y) * (newZoom / camera.zoom),
    zoom: newZoom,
  };
}

/** Distance between two points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}
