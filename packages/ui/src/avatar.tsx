"use client";

import React from "react";
import { cn } from "./cn";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({ src, name, color, size = "md", className }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "User"}
        className={cn(
          "rounded-full object-cover ring-2 ring-white",
          sizeMap[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white",
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: color ?? "#6366f1" }}
    >
      {initials}
    </div>
  );
}
