import { create } from "zustand";
import type {
  Camera,
  ToolType,
  ElementId,
  Bounds,
  ShapeType,
  StickyColor,
} from "@whiteboard/types";

export interface EditorState {
  // Camera / viewport
  camera: Camera;
  setCamera: (camera: Camera) => void;

  // Active tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Tool options
  activeShapeType: ShapeType;
  setActiveShapeType: (shape: ShapeType) => void;
  activeStickyColor: StickyColor;
  setActiveStickyColor: (color: StickyColor) => void;

  // Selection
  selectedIds: ElementId[];
  setSelectedIds: (ids: ElementId[]) => void;
  addToSelection: (id: ElementId) => void;
  removeFromSelection: (id: ElementId) => void;
  clearSelection: () => void;

  // Selection box (rubber-band selection)
  selectionBox: Bounds | null;
  setSelectionBox: (box: Bounds | null) => void;

  // Editing state
  editingElementId: ElementId | null;
  setEditingElementId: (id: ElementId | null) => void;

  // UI panels
  isPanelOpen: boolean;
  togglePanel: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Camera
  camera: { x: 0, y: 0, zoom: 1 },
  setCamera: (camera) => set({ camera }),

  // Tool
  activeTool: "select",
  setActiveTool: (activeTool) =>
    set({ activeTool, selectionBox: null }),

  // Tool options
  activeShapeType: "rectangle",
  setActiveShapeType: (activeShapeType) => set({ activeShapeType }),
  activeStickyColor: "yellow",
  setActiveStickyColor: (activeStickyColor) => set({ activeStickyColor }),

  // Selection
  selectedIds: [],
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  addToSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds
        : [...state.selectedIds, id],
    })),
  removeFromSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),
  clearSelection: () => set({ selectedIds: [], editingElementId: null }),

  // Selection box
  selectionBox: null,
  setSelectionBox: (selectionBox) => set({ selectionBox }),

  // Editing
  editingElementId: null,
  setEditingElementId: (editingElementId) => set({ editingElementId }),

  // Panels
  isPanelOpen: false,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
}));
