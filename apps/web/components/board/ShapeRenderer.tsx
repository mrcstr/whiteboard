"use client";

import React from "react";
import type { ShapeElement } from "@whiteboard/types";

interface Props {
  element: ShapeElement;
}

export function ShapeRenderer({ element }: Props) {
  const { size, shapeType, fillColor, strokeColor, strokeWidth } = element;
  const w = size.width;
  const h = size.height;

  const renderShape = () => {
    switch (shapeType) {
      case "rectangle":
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={w - strokeWidth}
            height={h - strokeWidth}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case "ellipse":
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={(w - strokeWidth) / 2}
            ry={(h - strokeWidth) / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case "triangle":
        return (
          <polygon
            points={`${w / 2},${strokeWidth} ${w - strokeWidth / 2},${h - strokeWidth / 2} ${strokeWidth / 2},${h - strokeWidth / 2}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case "diamond":
        return (
          <polygon
            points={`${w / 2},${strokeWidth} ${w - strokeWidth / 2},${h / 2} ${w / 2},${h - strokeWidth} ${strokeWidth / 2},${h / 2}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case "star": {
        const cx = w / 2;
        const cy = h / 2;
        const outerR = Math.min(w, h) / 2 - strokeWidth;
        const innerR = outerR * 0.4;
        const points = Array.from({ length: 10 }, (_, i) => {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? outerR : innerR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(" ");
        return (
          <polygon
            points={points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      }
    }
  };

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="pointer-events-none"
    >
      {renderShape()}
    </svg>
  );
}
