"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const THEME_KEY = "task-board-theme";
const THEME_CHANGE_EVENT = "task-board-theme-change";

function getTheme(): Theme {
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeToTheme(onChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const syncTheme = () => {
    document.documentElement.dataset.theme = getTheme();
    onChange();
  };

  window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
  window.addEventListener("storage", syncTheme);
  mediaQuery.addEventListener("change", syncTheme);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
    window.removeEventListener("storage", syncTheme);
    mediaQuery.removeEventListener("change", syncTheme);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => "light");

  useEffect(() => {
    document.documentElement.dataset.theme = getTheme();
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "فعال‌کردن تم روشن" : "فعال‌کردن تم تیره"}
      className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-sm shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-raised hover:shadow-md hover:shadow-primary/15 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
    >
      <span className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        {theme === "dark" ? (
          <Sun aria-hidden="true" size={18} strokeWidth={1.8} />
        ) : (
          <Moon aria-hidden="true" size={18} strokeWidth={1.8} />
        )}
      </span>
    </button>
  );
}
