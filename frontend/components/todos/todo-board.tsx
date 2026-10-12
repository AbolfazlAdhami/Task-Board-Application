"use client";

import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, type CurrentUser } from "../../lib/api/auth-api";
import { todosApi, type Todo, type TodoStatus } from "../../lib/api/todos-api";
import { usersApi, type UserSummary } from "../../lib/api/users-api";
import { TodoFormDialog } from "./todo-form-dialog";
import { RichTextPreview } from "./rich-text-editor";

import { DragDropProvider, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/react";

type StatusFilter = "all" | TodoStatus;

const statusLabels: Record<TodoStatus, string> = {
  todo: "برای انجام",
  in_progress: "در حال انجام",
  done: "انجام‌شده",
};

const priorityLabels = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
} as const;

const columns: TodoStatus[] = ["todo", "in_progress", "done"];

function FilterListbox({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label;

  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxLabel className="sr-only">{label}</ListboxLabel>
      <ListboxButton className="flex min-w-40 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
        <span>{selectedLabel}</span>
        <span aria-hidden="true" className="text-slate-400">
          ⌄
        </span>
      </ListboxButton>
      <ListboxOptions anchor="bottom end" className="z-30 mt-2 max-h-64 w-56 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl focus:outline-none">
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 data-[focus]:bg-indigo-50 data-[selected]:font-bold"
          >
            {({ selected }) => (
              <>
                <span>{option.label}</span>
                {selected && <span aria-hidden="true">✓</span>}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

function TodoCard({ todo, assigneeName, onEdit, canDrag }: { todo: Todo; assigneeName: string; onEdit?: () => void; canDrag: boolean }) {
  const dueDate = todo.dueDate ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(`${todo.dueDate}T00:00:00`)) : null;

  const { ref, handleRef, isDragging } = useDraggable({
    id: `todo:${todo.id}`,
    data: { todoId: todo.id },
    disabled: !canDrag,
  });
  return (
    <article ref={ref} aria-label={`وظیفه: ${todo.title}`} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${isDragging ? "opacity-60 ring-2 ring-indigo-400" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        {canDrag && (
          <button
            ref={handleRef}
            type="button"
            aria-label={`جابجایی وظیفهٔ ${todo.title}`}
            title="شروع جابه‌جایی با Space یا Enter؛ لغو با Escape"
            className="rounded-lg px-2 py-1 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span aria-hidden="true">⠿</span>
          </button>
        )}
        <h3 className="font-bold leading-7 text-slate-900">{todo.title}</h3>
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">اولویت {priorityLabels[todo.priority]}</span>
      </div>
      {todo.description.content.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <RichTextPreview value={todo.description} />
        </div>
      )}
      <dl className="mt-4 space-y-2 text-xs text-slate-500">
        <div className="flex justify-between gap-3">
          <dt>مسئول</dt>
          <dd className="font-medium text-slate-700">{assigneeName}</dd>
        </div>
        {dueDate && (
          <div className="flex justify-between gap-3">
            <dt>مهلت</dt>
            <dd dir="auto" className="font-medium text-slate-700">
              {dueDate}
            </dd>
          </div>
        )}
      </dl>
      {onEdit && (
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            aria-label={`ویرایش ${todo.title}`}
            onClick={onEdit}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            ویرایش
          </button>
        </div>
      )}
    </article>
  );
}

export function TodoBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [statusChangeError, setStatusChangeError] = useState("");
  const [statusChangePending, setStatusChangePending] = useState(false);

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled || currentUser?.role !== "owner" || statusChangePending) {
      return;
    }

    const todoId = event.operation.source?.data.todoId;
    const nextStatus = event.operation.target?.data.status;

    if (typeof todoId !== "string" || typeof nextStatus !== "string" || !columns.includes(nextStatus as TodoStatus)) {
      return;
    }

    const existingTodo = todos.find((todo) => todo.id === todoId);
    if (!existingTodo || existingTodo.status === nextStatus) return;

    const previousStatus = existingTodo.status;
    const updatedStatus = nextStatus as TodoStatus;

    setStatusChangeError("");
    setStatusChangePending(true);

    // نمایش فوری جابه‌جایی در برد
    setTodos((current) => current.map((todo) => (todo.id === todoId ? { ...todo, status: updatedStatus } : todo)));

    void todosApi
      .update(todoId, { status: updatedStatus })
      .then((savedTodo) => {
        setTodos((current) => current.map((todo) => (todo.id === savedTodo.id ? savedTodo : todo)));
      })
      .catch(() => {
        // اگر ذخیره‌سازی شکست خورد، کارت را به وضعیت قبلی برگردان
        setTodos((current) => current.map((todo) => (todo.id === todoId ? { ...todo, status: previousStatus } : todo)));
        setStatusChangeError("تغییر وضعیت ذخیره نشد؛ دوباره تلاش کنید.");
      })
      .finally(() => setStatusChangePending(false));
  }

  function handleSaved(saved: Todo) {
    setTodos((current) => (current.some((todo) => todo.id === saved.id) ? current.map((todo) => (todo.id === saved.id ? saved : todo)) : [saved, ...current]));
    setFormOpen(false);
    setEditingTodo(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingTodo(null);
  }

  function openCreateForm() {
    setEditingTodo(null);
    setFormOpen(true);
  }

  function openEditForm(todo: Todo) {
    setEditingTodo(todo);
    setFormOpen(true);
  }

  function canEditTodo(todo: Todo) {
    if (!currentUser) return false;
    if (currentUser.role !== "member") return true;

    return todo.createdBy === currentUser.userId || todo.assignedTo === currentUser.userId;
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [me, taskList] = await Promise.all([authApi.me(), todosApi.list()]);

        if (!active) return;

        setCurrentUser(me);
        setTodos(taskList);

        if (me.role !== "member") {
          try {
            const teamUsers = await usersApi.list();
            if (active) setUsers(teamUsers);
          } catch {
            if (active) setUsers([]);
          }
        }
      } catch {
        if (active) setError("وظایف بارگذاری نشدند. اتصال API را بررسی کنید.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const assigneeOptions = useMemo(() => {
    const options = [{ value: "all", label: "همهٔ مسئول‌ها" }];

    if (currentUser?.role === "member") {
      options.push({ value: "mine", label: "مسئول: من" }, { value: "unassigned", label: "بدون مسئول" });
      return options;
    }

    options.push({ value: "unassigned", label: "بدون مسئول" });
    for (const user of users) {
      options.push({ value: user.id, label: user.displayName });
    }
    return options;
  }, [currentUser, users]);

  const filteredTodos = useMemo(
    () =>
      todos.filter((todo) => {
        const matchesStatus = statusFilter === "all" || todo.status === statusFilter;

        const matchesAssignee =
          assigneeFilter === "all" || (assigneeFilter === "unassigned" && todo.assignedTo === null) || (assigneeFilter === "mine" && todo.assignedTo === currentUser?.userId) || todo.assignedTo === assigneeFilter;

        return matchesStatus && matchesAssignee;
      }),
    [todos, statusFilter, assigneeFilter, currentUser],
  );

  const userNames = useMemo(() => new Map(users.map((user) => [user.id, user.displayName])), [users]);

  if (loading) {
    return (
      <p className="py-10 text-sm text-slate-500" aria-live="polite">
        در حال دریافت وظایف…
      </p>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">
        {error}
        <button type="button" onClick={() => window.location.reload()} className="mr-3 font-bold underline">
          تلاش دوباره
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="board-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-700">فضای کار تیم</p>
          <h2 id="board-title" className="mt-2 text-2xl font-black text-slate-900">
            برد وظایف
          </h2>
          <p className="mt-2 text-sm text-slate-500">{filteredTodos.length} وظیفه</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            وظیفهٔ جدید
          </button>
          <FilterListbox
            label="فیلتر وضعیت"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            options={[
              { value: "all", label: "همهٔ وضعیت‌ها" },
              ...columns.map((status) => ({
                value: status,
                label: statusLabels[status],
              })),
            ]}
          />
          <FilterListbox label="فیلتر مسئول" value={assigneeFilter} onChange={setAssigneeFilter} options={assigneeOptions} />
        </div>
      </div>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="grid items-start gap-4 md:grid-cols-3">
          {columns.map((status) => {
            const laneTodos = filteredTodos.filter((todo) => todo.status === status);

            return (
              <BoardLane key={status} status={status} count={laneTodos.length} canDrop={currentUser?.role === "owner"}>
                {laneTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    canDrag={currentUser?.role === "owner" && !statusChangePending}
                    assigneeName={todo.assignedTo ? (userNames.get(todo.assignedTo) ?? (todo.assignedTo === currentUser?.userId ? "من" : "عضو تیم")) : "بدون مسئول"}
                    onEdit={canEditTodo(todo) ? () => openEditForm(todo) : undefined}
                  />
                ))}
                {laneTodos.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">وظیفه‌ای در این ستون نیست.</p>}
              </BoardLane>
            );
          })}
        </div>
      </DragDropProvider>
      {statusChangeError && (
        <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {statusChangeError}
        </p>
      )}
      {currentUser && formOpen && <TodoFormDialog key={editingTodo?.id ?? "new-task"} open={formOpen} task={editingTodo} currentUser={currentUser} users={users} onClose={closeForm} onSaved={handleSaved} />}
    </section>
  );
}

function BoardLane({ status, count, canDrop, children }: { status: TodoStatus; count: number; canDrop: boolean; children: ReactNode }) {
  const { ref, isDropTarget } = useDroppable({
    id: `lane:${status}`,
    data: { status },
    disabled: !canDrop,
  });

  return (
    <section ref={ref} aria-labelledby={`lane-${status}`} className={`min-h-64 rounded-2xl p-3 transition-colors sm:p-4 ${isDropTarget ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-slate-100/80"}`}>
      <header className="mb-3 flex items-center justify-between px-1">
        <h3 id={`lane-${status}`} className="font-bold text-slate-800">
          {statusLabels[status]}
        </h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">{count}</span>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
