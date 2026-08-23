"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { Moon, Smartphone, Sun } from "lucide-react";

export type Theme = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";
const THEME_CHANGE_EVENT = "logit-theme-change";
const THEME_TRANSITION_ATTRIBUTE = "data-theme-transition";
const COLOR_SCHEME_ATTRIBUTE = "data-color-scheme";
const THEME_STORAGE_KEY = "logit-theme";
const THEME_TRANSITION_DURATION_MS = 280;

let themeTransitionCleanupTimer: number | undefined;
let themeTransitionFrameOne: number | undefined;
let themeTransitionFrameTwo: number | undefined;
let requestedTheme: Theme | undefined;

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredPreference(): ThemePreference {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return "system";
}

function readCurrentTheme(): Theme {
  if (requestedTheme === "dark" || requestedTheme === "light") {
    return requestedTheme;
  }

  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === "dark" || domTheme === "light") {
    return domTheme;
  }

  return resolveTheme(readStoredPreference());
}

function commitTheme(theme: Theme) {
  const root = document.documentElement;

  requestedTheme = theme;
  root.dataset.theme = theme;
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

function applyPreference(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyTheme(resolveTheme(preference));
}

export function useThemeToggle() {
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

  const toggleTheme = useCallback(() => {
    const current = readCurrentTheme();
    const nextTheme = current === "dark" ? "light" : "dark";
    applyPreference(nextTheme);
    setTheme(nextTheme);
  }, []);

  return { theme, toggleTheme };
}

const THEME_OPTIONS: Array<{
  preference: ThemePreference;
  label: string;
  Icon: typeof Sun;
}> = [
  { preference: "system", label: "System theme", Icon: Smartphone },
  { preference: "light", label: "Light theme", Icon: Sun },
  { preference: "dark", label: "Dark theme", Icon: Moon },
];

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useLayoutEffect(() => {
    function syncPreference() {
      setPreference(readStoredPreference());
    }

    function handleThemeChange() {
      syncPreference();
    }

    syncPreference();
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleSystemChange() {
      if (readStoredPreference() === "system") {
        applyTheme(resolveTheme("system"));
      }
    }
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  return (
    <div className="theme-toggle">
      {THEME_OPTIONS.map(({ preference: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          className="theme-toggle-option"
          onClick={() => {
            setPreference(option);
            applyPreference(option);
          }}
          title={label}
          data-active={preference === option}
        >
          <Icon strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
