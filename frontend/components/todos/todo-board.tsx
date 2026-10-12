"use client";

import { useEffect, useMemo, useState } from "react";
import { authApi, type CurrentUser } from "../../lib/api/auth-api";
import { todosApi, type Todo, type TodoStatus } from "../../lib/api/todos-api";
import { usersApi, type UserSummary } from "../../lib/api/users-api";
import { TodoBoardSkeleton } from "./todo-board-skeleton";
import { TodoBoardToolbar } from "./todo-board-toolbar";
import { TodoCard } from "./todo-card";
import { TodoColumn, todoStatusLabels } from "./todo-column";
import { TodoDeleteDialog } from "./todo-delete-dialog";
import { TodoFormDialog } from "./todo-form-dialog";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";

type StatusFilter = "all" | TodoStatus;

const columns: TodoStatus[] = ["todo", "in_progress", "done"];

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
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function canDeleteTodo(todo: Todo) {
    if (!currentUser) return false;
    if (currentUser.role !== "member") return true;

    return todo.createdBy === currentUser.userId;
  }

  async function handleDeleteTodo() {
    if (!deletingTodo || deletePending) return;

    const target = deletingTodo;
    setDeletePending(true);
    setDeleteError("");

    try {
      await todosApi.remove(target.id);
      setTodos((current) => current.filter((todo) => todo.id !== target.id));
      setDeletingTodo(null);
    } catch {
      setDeleteError("حذف وظیفه انجام نشد؛ دوباره تلاش کن.");
    } finally {
      setDeletePending(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (
      event.canceled ||
      currentUser?.role !== "owner" ||
      statusChangePending
    ) {
      return;
    }

    const todoId = event.operation.source?.data.todoId;
    const nextStatus = event.operation.target?.data.status;

    if (
      typeof todoId !== "string" ||
      typeof nextStatus !== "string" ||
      !columns.includes(nextStatus as TodoStatus)
    ) {
      return;
    }

    const existingTodo = todos.find((todo) => todo.id === todoId);
    if (!existingTodo || existingTodo.status === nextStatus) return;

    const previousStatus = existingTodo.status;
    const updatedStatus = nextStatus as TodoStatus;

    setStatusChangeError("");
    setStatusChangePending(true);

    // نمایش فوری جابه‌جایی در برد
    setTodos((current) =>
      current.map((todo) =>
        todo.id === todoId ? { ...todo, status: updatedStatus } : todo,
      ),
    );

    void todosApi
      .update(todoId, { status: updatedStatus })
      .then((savedTodo) => {
        setTodos((current) =>
          current.map((todo) => (todo.id === savedTodo.id ? savedTodo : todo)),
        );
      })
      .catch(() => {
        // اگر ذخیره‌سازی شکست خورد، کارت را به وضعیت قبلی برگردان
        setTodos((current) =>
          current.map((todo) =>
            todo.id === todoId ? { ...todo, status: previousStatus } : todo,
          ),
        );
        setStatusChangeError("تغییر وضعیت ذخیره نشد؛ دوباره تلاش کنید.");
      })
      .finally(() => setStatusChangePending(false));
  }

  function handleSaved(saved: Todo) {
    setTodos((current) =>
      current.some((todo) => todo.id === saved.id)
        ? current.map((todo) => (todo.id === saved.id ? saved : todo))
        : [saved, ...current],
    );
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

    return (
      todo.createdBy === currentUser.userId ||
      todo.assignedTo === currentUser.userId
    );
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [me, taskList] = await Promise.all([
          authApi.me(),
          todosApi.list(),
        ]);

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
      options.push(
        { value: "mine", label: "مسئول: من" },
        { value: "unassigned", label: "بدون مسئول" },
      );
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
        const matchesStatus =
          statusFilter === "all" || todo.status === statusFilter;

        const matchesAssignee =
          assigneeFilter === "all" ||
          (assigneeFilter === "unassigned" && todo.assignedTo === null) ||
          (assigneeFilter === "mine" &&
            todo.assignedTo === currentUser?.userId) ||
          todo.assignedTo === assigneeFilter;

        return matchesStatus && matchesAssignee;
      }),
    [todos, statusFilter, assigneeFilter, currentUser],
  );

  const userNames = useMemo(
    () => new Map(users.map((user) => [user.id, user.displayName])),
    [users],
  );

  if (loading) {
    return <TodoBoardSkeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-danger/20 bg-danger/10 p-5 text-sm text-danger"
      >
        {error}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mr-3 font-bold underline"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="board-title">
      <TodoBoardToolbar
        taskCount={filteredTodos.length}
        statusFilter={statusFilter}
        assigneeFilter={assigneeFilter}
        statusOptions={[
          { value: "all", label: "همهٔ وضعیت‌ها" },
          ...columns.map((status) => ({
            value: status,
            label: todoStatusLabels[status],
          })),
        ]}
        assigneeOptions={assigneeOptions}
        onStatusChange={(value) => setStatusFilter(value as StatusFilter)}
        onAssigneeChange={setAssigneeFilter}
        onCreate={openCreateForm}
      />
      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="grid items-start gap-4 md:grid-cols-3">
          {columns.map((status) => {
            const laneTodos = filteredTodos.filter(
              (todo) => todo.status === status,
            );

            return (
              <TodoColumn
                key={status}
                status={status}
                count={laneTodos.length}
                canDrop={currentUser?.role === "owner"}
              >
                {laneTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    canDrag={
                      currentUser?.role === "owner" && !statusChangePending
                    }
                    assigneeName={
                      todo.assignedTo
                        ? (userNames.get(todo.assignedTo) ??
                          (todo.assignedTo === currentUser?.userId
                            ? "من"
                            : "عضو تیم"))
                        : "بدون مسئول"
                    }
                    onEdit={
                      canEditTodo(todo) ? () => openEditForm(todo) : undefined
                    }
                    onDelete={
                      canDeleteTodo(todo)
                        ? () => {
                            setDeleteError("");
                            setDeletingTodo(todo);
                          }
                        : undefined
                    }
                  />
                ))}
                {laneTodos.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border px-3 py-7 text-center text-xs text-muted">
                    وظیفه‌ای در این ستون نیست.
                  </p>
                )}
              </TodoColumn>
            );
          })}
        </div>
      </DragDropProvider>
      {statusChangeError && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger"
        >
          {statusChangeError}
        </p>
      )}
      <TodoDeleteDialog
        title={deletingTodo?.title}
        open={deletingTodo !== null}
        pending={deletePending}
        error={deleteError}
        onClose={() => {
          setDeletingTodo(null);
          setDeleteError("");
        }}
        onConfirm={() => void handleDeleteTodo()}
      />
      {currentUser && formOpen && (
        <TodoFormDialog
          key={editingTodo?.id ?? "new-task"}
          open={formOpen}
          task={editingTodo}
          currentUser={currentUser}
          users={users}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}
