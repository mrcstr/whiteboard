// Core store
export { useEditorStore } from "./store";
export type { EditorState } from "./store";

// Element factories
export {
  createStickyNote,
  createTextElement,
  createShape,
  createLine,
  createImage,
  createFrame,
} from "./elements/factory";

// Canvas utilities
export {
  screenToCanvas,
  canvasToScreen,
  getElementBounds,
  pointInBounds,
  boundsOverlap,
  getEnclosingBounds,
  clampZoom,
  zoomAroundPoint,
  distance,
} from "./utils/canvas";
