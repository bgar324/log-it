"use client";

import { useSyncExternalStore } from "react";
import { getCurrentPacificDate, millisecondsUntilPacificMidnight } from "@/lib/workout-date-ops";
import { formatDatabaseDateValue } from "@/lib/workout-date-formatters";

function currentDay() {
  return formatDatabaseDateValue(getCurrentPacificDate());
}

function subscribe(onChange: () => void) {
  let timer = 0;
  const schedule = () => {
    window.clearTimeout(timer);
    if (document.visibilityState === "hidden") return;
    timer = window.setTimeout(() => { onChange(); schedule(); }, millisecondsUntilPacificMidnight());
  };
  const resume = () => { onChange(); schedule(); };
  const onVisibility = () => { if (document.visibilityState === "visible") resume(); else window.clearTimeout(timer); };
  window.addEventListener("pageshow", resume);
  window.addEventListener("focus", resume);
  document.addEventListener("visibilitychange", onVisibility);
  schedule();
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("pageshow", resume);
    window.removeEventListener("focus", resume);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

export function usePacificDay() {
  return useSyncExternalStore(subscribe, currentDay, currentDay);
}
