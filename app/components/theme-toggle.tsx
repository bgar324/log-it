"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

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
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "light" : readCurrentTheme(),
  );

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
