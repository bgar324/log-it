"use client";

import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const THEME_CHANGE_EVENT = "logit-theme-change";
const THEME_TRANSITION_ATTRIBUTE = "data-theme-transition";
const COLOR_SCHEME_ATTRIBUTE = "data-color-scheme";
const THEME_TRANSITION_DURATION_MS = 280;

let themeTransitionCleanupTimer: number | undefined;
let themeTransitionFrameOne: number | undefined;
let themeTransitionFrameTwo: number | undefined;
let requestedTheme: Theme | undefined;

function readCurrentTheme(): Theme {
  if (requestedTheme === "dark" || requestedTheme === "light") {
    return requestedTheme;
  }

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

function commitTheme(theme: Theme) {
  const root = document.documentElement;

  requestedTheme = theme;
  root.dataset.theme = theme;
  window.localStorage.setItem("logit-theme", theme);
  window.dispatchEvent(
    new CustomEvent<Theme>(THEME_CHANGE_EVENT, {
      detail: theme,
    }),
  );

  themeTransitionCleanupTimer = window.setTimeout(() => {
    root.setAttribute(COLOR_SCHEME_ATTRIBUTE, theme);
    root.removeAttribute(THEME_TRANSITION_ATTRIBUTE);
    themeTransitionCleanupTimer = undefined;
  }, THEME_TRANSITION_DURATION_MS);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  requestedTheme = theme;

  if (themeTransitionCleanupTimer !== undefined) {
    window.clearTimeout(themeTransitionCleanupTimer);
    themeTransitionCleanupTimer = undefined;
  }

  if (themeTransitionFrameOne !== undefined) {
    window.cancelAnimationFrame(themeTransitionFrameOne);
    themeTransitionFrameOne = undefined;
  }

  if (themeTransitionFrameTwo !== undefined) {
    window.cancelAnimationFrame(themeTransitionFrameTwo);
    themeTransitionFrameTwo = undefined;
  }

  if (root.getAttribute(THEME_TRANSITION_ATTRIBUTE) === "true") {
    commitTheme(theme);
    return;
  }

  root.setAttribute(THEME_TRANSITION_ATTRIBUTE, "true");
  root.getBoundingClientRect();

  themeTransitionFrameOne = window.requestAnimationFrame(() => {
    themeTransitionFrameOne = undefined;

    themeTransitionFrameTwo = window.requestAnimationFrame(() => {
      themeTransitionFrameTwo = undefined;
      commitTheme(theme);
    });
  });
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    function syncTheme() {
      const resolvedTheme = readCurrentTheme();
      requestedTheme = resolvedTheme;
      setTheme(resolvedTheme);
    }

    function handleThemeChange(event: Event) {
      const nextTheme =
        event instanceof CustomEvent && (event.detail === "light" || event.detail === "dark")
          ? event.detail
          : readCurrentTheme();
      requestedTheme = nextTheme;
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
