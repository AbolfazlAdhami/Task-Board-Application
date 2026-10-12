"use client";

import { Plus, RefreshCw, Search } from "lucide-react";
import type { UserRole } from "@/lib/api/auth-api";

export type RoleFilter = "all" | UserRole;

export function UserDirectoryToolbar({
  count,
  total,
  canManage,
  query,
  roleFilter,
  showInactive,
  loading,
  onQueryChange,
  onRoleFilterChange,
  onShowInactiveChange,
  onRefresh,
  onCreate,
}: {
  count: number;
  total: number;
  canManage: boolean;
  query: string;
  roleFilter: RoleFilter;
  showInactive: boolean;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: RoleFilter) => void;
  onShowInactiveChange: (value: boolean) => void;
  onRefresh: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h2 id="users-heading" className="text-base font-bold text-foreground">
          اعضای تیم
        </h2>
        <p className="mt-1 text-xs text-muted">
          {count.toLocaleString("fa-IR")} نفر از {total.toLocaleString("fa-IR")}{" "}
          کاربر
          {!canManage && " · دسترسی شما فقط برای مشاهده است"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-48 flex-1 sm:flex-none">
          <span className="sr-only">جست‌وجوی کاربران</span>
          <Search
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="نام یا ایمیل"
            className="min-h-10 w-full rounded-xl border border-border bg-background py-2 pe-9 ps-3 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="sr-only" htmlFor="users-role-filter">
          فیلتر نقش
        </label>
        <select
          id="users-role-filter"
          value={roleFilter}
          onChange={(event) =>
            onRoleFilterChange(event.target.value as RoleFilter)
          }
          className="min-h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">همهٔ نقش‌ها</option>
          <option value="owner">مالک</option>
          <option value="manager">مدیر</option>
          <option value="member">عضو</option>
        </select>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => onShowInactiveChange(event.target.checked)}
            className="size-4 accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          غیرفعال‌ها
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="تازه‌سازی فهرست کاربران"
          className="grid size-10 place-items-center rounded-xl border border-border text-muted transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <RefreshCw
            aria-hidden="true"
            size={16}
            className={loading ? "animate-spin" : ""}
          />
        </button>
        {canManage && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Plus aria-hidden="true" size={17} />
            افزودن کاربر
          </button>
        )}
      </div>
    </div>
  );
}
