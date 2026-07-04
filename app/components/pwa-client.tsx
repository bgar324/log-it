"use client";

import { useEffect } from "react";

const THEME_CHANGE_EVENT = "logit-theme-change";

function themeColorFor(theme: string | undefined) {
  return theme === "dark" ? "#000000" : "#ffffff";
}

export function PwaClient() {
  useEffect(() => {
    // Keep the status-bar / theme-color meta in sync with the manual theme
    // (viewport.themeColor only follows the system preference).
    const meta = document.querySelector('meta[name="theme-color"]');
    const sync = () =>
      meta?.setAttribute("content", themeColorFor(document.documentElement.dataset.theme));
    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);

    // Register the service worker in production only; a dev SW fights HMR.
    let removeLoad = () => {};
    if (
      process.env.NODE_ENV === "production" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const onLoad = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      };
      window.addEventListener("load", onLoad);
      removeLoad = () => window.removeEventListener("load", onLoad);
    }

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      removeLoad();
    };
  }, []);

  return null;
}
