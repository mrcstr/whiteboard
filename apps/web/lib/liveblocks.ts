"use client";

import { createClient, LiveList, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { BoardElement, ElementId, UserPresence } from "@whiteboard/types";

export { LiveList, LiveMap };

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Liveblocks type definitions
type Presence = {
  cursor: { x: number; y: number } | null;
  selectedElementIds: string[];
  name: string;
  color: string;
};

type Storage = {
  elements: any;
  elementOrder: any;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar?: string;
    color: string;
  };
};

type RoomEvent = {
  type: "ELEMENT_DELETED" | "CURSOR_CLICK";
  elementId?: string;
  position?: { x: number; y: number };
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useOthersMapped,
  useSelf,
  useStorage,
  useMutation,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useBroadcastEvent,
  useEventListener,
  useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
