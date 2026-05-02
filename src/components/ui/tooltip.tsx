"use client";

import { useState, useRef, type ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  function show() {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setVisible(true), 200);
  }

  function hide() {
    clearTimeout(timeout.current);
    setVisible(false);
  }

  const posClass = position === "bottom"
    ? "top-full mt-2 left-1/2 -translate-x-1/2"
    : "bottom-full mb-2 left-1/2 -translate-x-1/2";

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          className={`absolute z-50 px-3 py-2 text-xs leading-relaxed text-text-primary
            bg-bg-tertiary rounded-lg shadow-lg max-w-[260px] w-max pointer-events-none
            animate-fade-in ${posClass}`}
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

export function DifficultyDot({ level }: { level: "beginner" | "intermediate" | "advanced" }) {
  const config = {
    beginner: { color: "bg-accent-emerald", label: "Beginner" },
    intermediate: { color: "bg-accent-gold", label: "Intermediate" },
    advanced: { color: "bg-accent-rose", label: "Advanced" },
  };
  const { color, label } = config[level];

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
