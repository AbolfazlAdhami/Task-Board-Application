"use client";

import { useDroppable } from "@dnd-kit/react";
import type { ReactNode } from "react";
import type { TodoStatus } from "../../lib/api/todos-api";

export const todoStatusLabels: Record<TodoStatus, string> = {
  todo: "برای انجام",
  in_progress: "در حال انجام",
  done: "انجام‌شده",
};

type TodoColumnProps = {
  status: TodoStatus;
  count: number;
  canDrop: boolean;
  children: ReactNode;
};

export function TodoColumn({ status, count, canDrop, children }: TodoColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id: `lane:${status}`,
    data: { status },
    disabled: !canDrop,
  });

  return (
    <section
      ref={ref}
      aria-labelledby={`lane-${status}`}
      className={`min-h-72 rounded-2xl border p-3 transition-colors sm:p-4 ${isDropTarget ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "border-border bg-surface-raised/70"}`}
    >
      <header className="mb-4 flex items-center justify-between px-1">
        <h3 id={`lane-${status}`} className="text-sm font-semibold text-foreground">
          {todoStatusLabels[status]}
        </h3>
        <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted">{count}</span>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
