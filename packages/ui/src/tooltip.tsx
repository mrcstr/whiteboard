"use client";

import React, { useState, useRef } from "react";
import { cn } from "./cn";

interface TooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

export function Tooltip({ content, side = "bottom", children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timeout.current = setTimeout(() => setVisible(true), 400);
  };

  const hide = () => {
    clearTimeout(timeout.current);
    setVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            positionClasses[side],
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
