"use client";

import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useEffect, useMemo, useState } from "react";
import { authApi, type CurrentUser } from "../../lib/api/auth-api";
import { todosApi, type Todo, type TodoStatus } from "../../lib/api/todos-api";
import { usersApi, type UserSummary } from "../../lib/api/users-api";

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

function TodoCard({ todo, assigneeName }: { todo: Todo; assigneeName: string }) {
  const dueDate = todo.dueDate ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(`${todo.dueDate}T00:00:00`)) : null;

  return (
    <article aria-label={`وظیفه: ${todo.title}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold leading-7 text-slate-900">{todo.title}</h3>
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">اولویت {priorityLabels[todo.priority]}</span>
      </div>
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

      <div className="grid items-start gap-4 md:grid-cols-3">
        {columns.map((status) => {
          const laneTodos = filteredTodos.filter((todo) => todo.status === status);

          return (
            <section key={status} aria-labelledby={`lane-${status}`} className="min-h-64 rounded-2xl bg-slate-100/80 p-3 sm:p-4">
              <header className="mb-3 flex items-center justify-between px-1">
                <h3 id={`lane-${status}`} className="font-bold text-slate-800">
                  {statusLabels[status]}
                </h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">{laneTodos.length}</span>
              </header>

              <div className="space-y-3">
                {laneTodos.map((todo) => (
                  <TodoCard key={todo.id} todo={todo} assigneeName={todo.assignedTo ? (userNames.get(todo.assignedTo) ?? (todo.assignedTo === currentUser?.userId ? "من" : "عضو تیم")) : "بدون مسئول"} />
                ))}
                {laneTodos.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">وظیفه‌ای در این ستون نیست.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
