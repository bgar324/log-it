"use client";

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
  function handleToggle() {
    const current = readCurrentTheme();
    applyTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      className="theme-icon-toggle"
      onClick={handleToggle}
      aria-label="Toggle color theme"
    >
      <span className="theme-toggle-slot theme-toggle-slot-sun" aria-hidden="true">
        <Sun className="theme-toggle-icon" strokeWidth={1.8} />
      </span>
      <span className="theme-toggle-slot theme-toggle-slot-moon" aria-hidden="true">
        <Moon className="theme-toggle-icon" strokeWidth={1.8} />
      </span>
    </button>
  );
}
