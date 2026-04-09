// ============================================
// Core Element Types for the Whiteboard
// ============================================

/** Unique identifier for board elements */
export type ElementId = string;
export type BoardId = string;
export type UserId = string;

/** 2D position on the canvas */
export interface Point {
  x: number;
  y: number;
}

/** Size of an element */
export interface Size {
  width: number;
  height: number;
}

/** Bounding box */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** All possible element types */
export type ElementType =
  | "sticky-note"
  | "text"
  | "shape"
  | "line"
  | "image"
  | "frame";

/** Shape variants */
export type ShapeType =
  | "rectangle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "star";

/** Line end styles */
export type LineEndStyle = "none" | "arrow" | "dot" | "square";

/** Sticky note color presets */
export type StickyColor =
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "purple"
  | "orange"
  | "gray";

/** Base properties shared by all elements */
export interface BaseElement {
  id: ElementId;
  type: ElementType;
  position: Point;
  size: Size;
  rotation: number;
  opacity: number;
  locked: boolean;
  parentFrameId?: ElementId;
  zIndex: number;
  createdBy: UserId;
  createdAt: number;
  updatedAt: number;
}

/** Sticky note element */
export interface StickyNoteElement extends BaseElement {
  type: "sticky-note";
  content: string;
  color: StickyColor;
  fontSize: number;
}

/** Free text element */
export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  textAlign: "left" | "center" | "right";
}

/** Shape element */
export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

/** Line / connector element */
export interface LineElement extends BaseElement {
  type: "line";
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  startEndStyle: LineEndStyle;
  endEndStyle: LineEndStyle;
  /** Optional: connect to other elements */
  startElementId?: ElementId;
  endElementId?: ElementId;
}

/** Image element */
export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
}

/** Frame element (groups other elements visually) */
export interface FrameElement extends BaseElement {
  type: "frame";
  title: string;
  backgroundColor: string;
  childIds: ElementId[];
}

/** Union of all element types */
export type BoardElement =
  | StickyNoteElement
  | TextElement
  | ShapeElement
  | LineElement
  | ImageElement
  | FrameElement;

// ============================================
// Board & Collaboration Types
// ============================================

/** Board metadata */
export interface Board {
  id: BoardId;
  name: string;
  ownerId: UserId;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Board with elements (full state) */
export interface BoardState {
  board: Board;
  elements: Record<ElementId, BoardElement>;
  elementOrder: ElementId[];
}

/** User presence on a board (for Liveblocks) */
export interface UserPresence {
  cursor: Point | null;
  selectedElementIds: ElementId[];
  user: {
    id: UserId;
    name: string;
    avatar?: string;
    color: string;
  };
}

/** Liveblocks storage structure */
export interface BoardStorage {
  elements: Record<ElementId, BoardElement>;
  elementOrder: ElementId[];
}

// ============================================
// Tool & Interaction Types
// ============================================

/** Available tools in the toolbar */
export type ToolType =
  | "select"
  | "hand"
  | "sticky-note"
  | "text"
  | "shape"
  | "line"
  | "image"
  | "frame"
  | "eraser";

/** Canvas viewport state */
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

/** Selection state */
export interface SelectionState {
  selectedIds: ElementId[];
  selectionBounds: Bounds | null;
}

// ============================================
// API Types
// ============================================

export interface CreateBoardInput {
  name: string;
}

export interface UpdateBoardInput {
  name?: string;
  thumbnail?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface BoardMember {
  userId: UserId;
  boardId: BoardId;
  role: "owner" | "editor" | "viewer";
  joinedAt: Date;
}
