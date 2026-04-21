"use client";

import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const THEME_CHANGE_EVENT = "logit-theme-change";

function readCurrentTheme(): Theme {
  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === "dark" || domTheme === "light") {
    return domTheme;
  }

  const storedTheme = window.localStorage.getItem("logit-theme");
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("logit-theme", theme);
  window.dispatchEvent(
    new CustomEvent<Theme>(THEME_CHANGE_EVENT, {
      detail: theme,
    }),
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    function syncTheme() {
      setTheme(readCurrentTheme());
    }

    function handleThemeChange(event: Event) {
      const nextTheme =
        event instanceof CustomEvent && (event.detail === "light" || event.detail === "dark")
          ? event.detail
          : readCurrentTheme();
      setTheme(nextTheme);
    }

    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    };
  }, []);

  function handleToggle() {
    const current = readCurrentTheme();
    const nextTheme = current === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-icon-toggle"
      onClick={handleToggle}
      aria-label="Toggle color theme"
      aria-pressed={theme === "dark"}
    >
      <span
        className="theme-toggle-slot theme-toggle-slot-sun"
        data-active={theme === "light"}
        aria-hidden="true"
      >
        <Sun className="theme-toggle-icon" strokeWidth={1.8} />
      </span>
      <span
        className="theme-toggle-slot theme-toggle-slot-moon"
        data-active={theme === "dark"}
        aria-hidden="true"
      >
        <Moon className="theme-toggle-icon" strokeWidth={1.8} />
      </span>
    </button>
  );
}
