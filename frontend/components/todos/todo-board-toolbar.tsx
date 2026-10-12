"use client";

import { ListFilter, Plus } from "lucide-react";
import type { TodoStatus } from "../../lib/api/todos-api";
import { TodoFilterListbox, type FilterOption } from "./todo-filter-listbox";

type TodoBoardToolbarProps = {
  taskCount: number;
  statusFilter: "all" | TodoStatus;
  assigneeFilter: string;
  statusOptions: FilterOption[];
  assigneeOptions: FilterOption[];
  onStatusChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onCreate: () => void;
};

export function TodoBoardToolbar({ taskCount, statusFilter, assigneeFilter, statusOptions, assigneeOptions, onStatusChange, onAssigneeChange, onCreate }: TodoBoardToolbarProps) {
  return (
    <header className="mb-6 flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-sm shadow-black/3 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="flex items-center gap-2 text-xs font-medium text-primary">
          <ListFilter aria-hidden="true" size={16} />
          فضای کار تیم
        </p>
        <h2 id="board-title" className="mt-2 text-xl font-bold tracking-tight text-foreground">
          برد وظایف
        </h2>
        <p className="mt-2 text-xs text-muted">نمایش {taskCount} وظیفه</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-0"
        >
          <Plus aria-hidden="true" size={17} />
          وظیفهٔ جدید
        </button>
        <TodoFilterListbox label="فیلتر وضعیت" value={statusFilter} onChange={onStatusChange} options={statusOptions} />
        <TodoFilterListbox label="فیلتر مسئول" value={assigneeFilter} onChange={onAssigneeChange} options={assigneeOptions} />
      </div>
    </header>
  );
}
