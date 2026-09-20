import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { useLayoutEffect } from "react";
import { ThemeToggle, useThemePreference, type ThemePreference } from "@/app/components/theme-toggle";
import { render } from "./render";

test("mounting Settings never commits Device before the saved preference", async () => {
  for (const stored of ["dark", "light"] as const) {
    window.localStorage.setItem("logit-theme", stored);
    const committed: ThemePreference[] = [];
    function PreferenceProbe() {
      const { preference } = useThemePreference();
      useLayoutEffect(() => { committed.push(preference); }, [preference]);
      return <output>{preference}</output>;
    }
    const mounted = await render(<PreferenceProbe />);
    try {
      assert.deepEqual(committed, [stored]);
    } finally {
      mounted.unmount();
      window.localStorage.removeItem("logit-theme");
    }
  }
});


test("theme selection updates immediately without waiting for the color animation", async (context) => {
  window.localStorage.setItem("logit-theme", "dark");
  context.mock.method(window, "requestAnimationFrame", () => 0);
  const mounted = await render(<><ThemeToggle /><ThemeToggle /></>);
  try {
    const light = mounted.container.querySelector<HTMLButtonElement>('button[title="Light theme"]');
    assert.ok(light);
    await mounted.click(light);
    assert.deepEqual(
      mounted.all('button[data-active="true"]').map(button => button.getAttribute("title")),
      ["Light theme", "Light theme"],
    );
    assert.equal(window.localStorage.getItem("logit-theme"), "light");
  } finally {
    mounted.unmount();
    window.localStorage.removeItem("logit-theme");
    document.documentElement.removeAttribute("data-theme-transition");
  }
});