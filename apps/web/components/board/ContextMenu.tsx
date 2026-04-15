"use client";

import React, { useEffect, useRef } from "react";
import {
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  Copy,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";

export interface ContextMenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface Props {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function ContextMenu({ x, y, actions, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Keep menu in viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 9999,
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="min-w-[180px] rounded-xl border bg-white/95 p-1 shadow-xl backdrop-blur-md animate-scale-in"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {actions.map((action, i) => (
        <React.Fragment key={i}>
          {action.divider && i > 0 && (
            <div className="my-1 h-px bg-zinc-100" />
          )}
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:opacity-30 ${
              action.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center opacity-60">
              {action.icon}
            </span>
            {action.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Helper to build standard element context menu actions */
export function buildElementActions(opts: {
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  isLocked: boolean;
}): ContextMenuAction[] {
  return [
    {
      label: "Ganz nach vorne",
      icon: <ArrowUpToLine className="h-3.5 w-3.5" />,
      onClick: opts.onBringToFront,
    },
    {
      label: "Eine Ebene hoch",
      icon: <ArrowUp className="h-3.5 w-3.5" />,
      onClick: opts.onBringForward,
    },
    {
      label: "Eine Ebene runter",
      icon: <ArrowDown className="h-3.5 w-3.5" />,
      onClick: opts.onSendBackward,
    },
    {
      label: "Ganz nach hinten",
      icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
      onClick: opts.onSendToBack,
    },
    {
      label: "Duplizieren",
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: opts.onDuplicate,
      divider: true,
    },
    {
      label: opts.isLocked ? "Entsperren" : "Sperren",
      icon: opts.isLocked
        ? <Unlock className="h-3.5 w-3.5" />
        : <Lock className="h-3.5 w-3.5" />,
      onClick: opts.onToggleLock,
    },
    {
      label: "Löschen",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: opts.onDelete,
      danger: true,
      divider: true,
    },
  ];
}
