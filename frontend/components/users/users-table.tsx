import { CircleUserRound, Pencil, Search } from "lucide-react";
import type { UserRole } from "@/lib/api/auth-api";
import type { UserSummary } from "@/lib/api/users-api";

const roleLabels: Record<UserRole, string> = {
  owner: "مالک",
  manager: "مدیر",
  member: "عضو",
};

const roleStyles: Record<UserRole, string> = {
  owner: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  manager: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  member: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export function UsersTable({ users, canManage, hasAnyUsers, onEdit }: { users: UserSummary[]; canManage: boolean; hasAnyUsers: boolean; onEdit: (user: UserSummary) => void }) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-right text-sm">
          <caption className="sr-only">فهرست و وضعیت کاربران تیم</caption>
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                کاربر
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                نقش
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                وضعیت
              </th>
              <th scope="col" className="px-5 py-3.5 font-semibold">
                عضویت
              </th>
              {canManage && (
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  عملیات
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="group transition-colors hover:bg-background/70">
                <td className="px-5 py-4">
                  <div className="flex min-w-52 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                      <CircleUserRound aria-hidden="true" size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground">{user.displayName}</span>
                      <span dir="ltr" className="mt-0.5 block truncate text-right text-xs text-muted">
                        {user.email}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[user.role]}`}>{roleLabels[user.role]}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? "text-emerald-700 dark:text-emerald-300" : "text-muted"}`}>
                    <span className={`size-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {user.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-muted">
                  <time dateTime={user.createdAt}>
                    {new Intl.DateTimeFormat("fa-IR", {
                      dateStyle: "medium",
                    }).format(new Date(user.createdAt))}
                  </time>
                </td>
                {canManage && (
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      aria-label={`ویرایش کاربر ${user.displayName}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Pencil aria-hidden="true" size={14} />
                      ویرایش
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="px-5 py-12 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-surface-raised text-muted">
            <Search aria-hidden="true" size={19} />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">{hasAnyUsers ? "کاربری با این فیلتر پیدا نشد." : "هنوز کاربری ثبت نشده است."}</p>
          {hasAnyUsers && <p className="mt-1 text-xs text-muted">عبارت جست‌وجو یا فیلترها را تغییر دهید.</p>}
        </div>
      )}
    </>
  );
}
