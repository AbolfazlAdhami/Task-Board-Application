"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { authApi, type CurrentUser } from "@/lib/api/auth-api";
import { usersApi, type UserSummary } from "@/lib/api/users-api";
import {
  UserDirectoryToolbar,
  type RoleFilter,
} from "./user-directory-toolbar";
import { UserFormDialog } from "./user-form-dialog";
import { UserSummaryCards } from "./user-summary-cards";
import { UsersTable } from "./users-table";

export function UsersList() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [notice, setNotice] = useState("");

  const fetchDirectory = useCallback(async () => {
    return Promise.all([usersApi.list(), authApi.me()]);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [result, me] = await fetchDirectory();
      setUsers(result);
      setCurrentUser(me);
    } catch {
      setError(
        "دریافت فهرست کاربران انجام نشد. اتصال و دسترسی خود را بررسی کنید.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchDirectory]);

  useEffect(() => {
    let active = true;

    fetchDirectory()
      .then(([result, me]) => {
        if (!active) return;
        setUsers(result);
        setCurrentUser(me);
      })
      .catch(() => {
        if (active) {
          setError(
            "دریافت فهرست کاربران انجام نشد. اتصال و دسترسی خود را بررسی کنید.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchDirectory]);

  const canManageUsers = currentUser?.role === "owner";
  const activeCount = users.filter((user) => user.isActive).length;
  const activeOwnerCount = users.filter(
    (user) => user.role === "owner" && user.isActive,
  ).length;

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fa");

    return users.filter((user) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        user.displayName.toLocaleLowerCase("fa").includes(normalizedQuery) ||
        user.email.toLocaleLowerCase("en").includes(normalizedQuery);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = showInactive || user.isActive;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, showInactive, users]);

  function openCreateDialog() {
    setEditingUser(null);
    setNotice("");
    setDialogOpen(true);
  }

  function openEditDialog(user: UserSummary) {
    setEditingUser(user);
    setNotice("");
    setDialogOpen(true);
  }

  function handleSaved(savedUser: UserSummary) {
    setUsers((current) => {
      const exists = current.some((user) => user.id === savedUser.id);
      return exists
        ? current.map((user) => (user.id === savedUser.id ? savedUser : user))
        : [savedUser, ...current];
    });
    setDialogOpen(false);
    setEditingUser(null);
    setNotice(
      editingUser
        ? "تغییرات کاربر ذخیره شد."
        : "کاربر جدید با موفقیت ساخته شد.",
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-3xl border border-border bg-surface">
        <p className="text-sm text-muted" role="status" aria-live="polite">
          در حال دریافت فهرست کاربران…
        </p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-danger/10 text-danger">
            <AlertCircle aria-hidden="true" size={22} />
          </span>
          <p className="mt-4 text-sm leading-6 text-foreground" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw aria-hidden="true" size={16} />
            تلاش دوباره
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-5" aria-labelledby="users-heading">
        <UserSummaryCards
          total={users.length}
          active={activeCount}
          owners={activeOwnerCount}
        />

        <div className="rounded-3xl border border-border bg-surface shadow-sm shadow-black/[0.02]">
          <UserDirectoryToolbar
            count={filteredUsers.length}
            total={users.length}
            canManage={canManageUsers}
            query={query}
            roleFilter={roleFilter}
            showInactive={showInactive}
            loading={loading}
            onQueryChange={setQuery}
            onRoleFilterChange={setRoleFilter}
            onShowInactiveChange={setShowInactive}
            onRefresh={() => void loadUsers()}
            onCreate={openCreateDialog}
          />

          {error && (
            <p
              role="alert"
              className="mx-4 mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger sm:mx-5"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              aria-live="polite"
              className="mx-4 mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 sm:mx-5"
            >
              {notice}
            </p>
          )}

          <UsersTable
            users={filteredUsers}
            canManage={canManageUsers}
            hasAnyUsers={users.length > 0}
            onEdit={openEditDialog}
          />
        </div>
      </section>

      <UserFormDialog
        key={editingUser?.id ?? "new-user"}
        open={dialogOpen}
        user={editingUser}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
