"use client";

import React from "react";
import type { Bounds } from "@whiteboard/types";

interface Props {
  bounds: Bounds;
}

export function SelectionBox({ bounds }: Props) {
  return (
    <div
      className="pointer-events-none absolute z-40 border border-blue-500 bg-blue-500/5"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      }}
    />
  );
}
