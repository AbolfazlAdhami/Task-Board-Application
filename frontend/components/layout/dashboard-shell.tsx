"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { authApi, type CurrentUser, type UserRole } from "../../lib/api/auth-api";

const roleLabels: Record<UserRole, string> = {
  owner: "مالک",
  manager: "مدیر",
  member: "عضو",
};

const navigation = [
  { href: "/", label: "وظایف", icon: "▦" },
  { href: "/users", label: "کاربران", icon: "♙", privileged: true },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");

    try {
      await authApi.logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("خروج انجام نشد. دوباره تلاش کنید.");
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center" aria-live="polite">
        <p className="text-sm text-slate-500">در حال بررسی نشست کاربری…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <section className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">برای ادامه وارد شوید</h1>
          <p className="mt-2 text-sm text-slate-500">نشست کاربری در دسترس نیست.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            رفتن به صفحهٔ ورود
          </Link>
        </section>
      </main>
    );
  }

  const visibleNavigation = navigation.filter((item) => !("privileged" in item) || user.role === "owner" || user.role === "manager");

  const pageTitle = pathname.startsWith("/users") ? "کاربران" : "وظایف";

  return (
    <div className="min-h-screen bg-[#f4f6fa] md:flex">
      <aside className="border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:right-0 md:w-64 md:border-b-0 md:border-l">
        <div className="flex items-center justify-between px-5 py-4 md:block md:px-6 md:py-7">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-900">
            تسک‌برد
          </Link>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 md:mt-2 md:inline-flex">فضای کار تیم</span>
        </div>

        <nav aria-label="ناوبری اصلی" className="flex gap-2 overflow-x-auto px-3 pb-3 md:flex-col md:px-4">
          {visibleNavigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <span aria-hidden="true" className="text-lg">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden px-6 py-5 text-xs leading-6 text-slate-400 md:block">مدیریت سادهٔ کارهای تیم</div>
      </aside>

      <div className="min-h-screen min-w-0 flex-1 md:mr-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-medium text-slate-500">تسک‌برد / {pageTitle}</p>
            <h1 className="mt-1 text-lg font-bold text-slate-900">{pageTitle}</h1>
          </div>

          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-800">{user.name.slice(0, 1)}</span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold text-slate-800">{user.name}</span>
                <span className="block text-xs text-slate-500">{roleLabels[user.role]}</span>
              </span>
              <span aria-hidden="true" className="text-slate-400">
                ⌄
              </span>
            </MenuButton>

            <MenuItems anchor="bottom end" className="z-30 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl focus:outline-none">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <MenuItem>
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => void handleLogout()}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-right text-sm font-semibold text-rose-700 data-[focus]:bg-rose-50 disabled:opacity-50"
                >
                  {loggingOut ? "در حال خروج…" : "خروج"}
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        </header>

        {logoutError && (
          <p role="alert" className="mx-4 mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-8">
            {logoutError}
          </p>
        )}

        <main id="main-content" className="mx-auto w-full max-w-[1440px] p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
