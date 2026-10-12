"use client";

import { useEffect, useState } from "react";
import { usersApi, type UserSummary } from "../../lib/api/users-api";

const roleLabels = {
  owner: "مالک",
  manager: "مدیر",
  member: "عضو",
} as const;

export function UsersList() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    usersApi
      .list()
      .then((result) => {
        if (active) setUsers(result);
      })
      .catch(() => {
        if (active) setError("فهرست کاربران بارگذاری نشد.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="py-10 text-sm text-slate-500" aria-live="polite">
        در حال دریافت کاربران…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-160 text-right text-sm">
        <caption className="sr-only">فهرست کاربران تیم</caption>
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-4 font-semibold">
              نام
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              ایمیل
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              نقش
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              وضعیت
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="text-slate-700">
              <td className="px-5 py-4 font-semibold text-slate-900">{user.displayName}</td>
              <td dir="ltr" className="px-5 py-4 text-right">
                {user.email}
              </td>
              <td className="px-5 py-4">{roleLabels[user.role]}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.isActive ? "فعال" : "غیرفعال"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && <p className="p-8 text-center text-sm text-slate-500">کاربری ثبت نشده است.</p>}
    </div>
  );
}
