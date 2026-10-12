"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  CalendarDays,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/react";
import type { Todo } from "../../lib/api/todos-api";
import { RichTextPreview } from "./rich-text-editor";

const priorityLabels = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
} as const;

const priorityStyles = {
  low: {
    backgroundColor: "var(--priority-low-bg)",
    color: "var(--priority-low-text)",
  },
  medium: {
    backgroundColor: "var(--priority-medium-bg)",
    color: "var(--priority-medium-text)",
  },
  high: {
    backgroundColor: "var(--priority-high-bg)",
    color: "var(--priority-high-text)",
  },
};

type TodoCardProps = {
  todo: Todo;
  assigneeName: string;
  canDrag: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TodoCard({
  todo,
  assigneeName,
  canDrag,
  onEdit,
  onDelete,
}: TodoCardProps) {
  const dueDate = todo.dueDate
    ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
        new Date(`${todo.dueDate}T00:00:00`),
      )
    : null;

  const { ref, handleRef, isDragging } = useDraggable({
    id: `todo:${todo.id}`,
    data: { todoId: todo.id },
    disabled: !canDrag,
  });

  return (
    <article
      ref={ref}
      aria-label={`وظیفه: ${todo.title}`}
      className={`group rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 ${
        isDragging ? "scale-[0.98] opacity-60 ring-2 ring-ring" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {canDrag && (
          <button
            ref={handleRef}
            type="button"
            aria-label={`جابجایی وظیفهٔ ${todo.title}`}
            title="شروع جابه‌جایی با Space یا Enter؛ لغو با Escape"
            className="mt-0.5 rounded-lg p-1 text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GripVertical aria-hidden="true" size={18} />
          </button>
        )}

        <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-6 text-foreground">
          {todo.title}
        </h3>

        <span
          style={priorityStyles[todo.priority]}
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
        >
          اولویت {priorityLabels[todo.priority]}
        </span>
      </div>

      {todo.description.content.length > 0 && (
        <div className="mt-3 border-t border-border pt-3 text-sm text-muted">
          <RichTextPreview value={todo.description} />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0 space-y-1.5 text-xs text-muted">
          <p className="flex items-center gap-1.5">
            <UserRound aria-hidden="true" size={14} />
            <span className="truncate">{assigneeName}</span>
          </p>

          {dueDate && (
            <p className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={14} />
              <span dir="auto">{dueDate}</span>
            </p>
          )}
        </div>

        {(onEdit || onDelete) && (
          <Menu as="div" className="relative shrink-0">
            <MenuButton
              type="button"
              aria-label={`عملیات وظیفهٔ ${todo.title}`}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal aria-hidden="true" size={19} />
            </MenuButton>

            <MenuItems
              anchor="bottom end"
              className="z-30 mt-2 min-w-36 rounded-xl border border-border bg-surface p-1 shadow-xl focus:outline-none"
            >
              {onEdit && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={onEdit}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-foreground ${focus ? "bg-surface-raised" : ""}`}
                    >
                      <Pencil aria-hidden="true" size={15} />
                      ویرایش
                    </button>
                  )}
                </MenuItem>
              )}

              {onDelete && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={onDelete}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-danger ${focus ? "bg-danger/10" : ""}`}
                    >
                      <Trash2 aria-hidden="true" size={15} />
                      حذف
                    </button>
                  )}
                </MenuItem>
              )}
            </MenuItems>
          </Menu>
        )}
      </div>
    </article>
  );
}
