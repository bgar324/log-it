import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { DashboardShell } from "@/app/dashboard/_components/dashboard-shell";
import { render } from "./render";
import posthog from "posthog-js";
import { AppTabBar } from "@/app/components/app-nav";
import { WorkspaceNavigationProvider, useWorkspaceUnsavedChanges } from "@/app/components/workspace-navigation";

const user = {
  displayName: "Test User",
  username: "test-user",
  avatarUrl: null,
};

function shell(sidebarCollapsed: boolean) {
  return (
    <DashboardShell
      activeView="dashboard"
      title="Home"
      user={user}
      benEnabled={false}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => {}}
      onNavigate={() => {}}
    >
      <div />
    </DashboardShell>
  );
}

test("the desktop sidebar exposes sign out in expanded and collapsed states", async () => {
  const mounted = await render(shell(false));
  const expandedForm = mounted.container.querySelector('aside form[action="/auth/signout"]');
  const expandedButton = expandedForm?.querySelector('button[type="submit"]');

  assert.ok(expandedForm);
  assert.equal(expandedForm.getAttribute("method"), "post");
  assert.match(expandedButton?.textContent ?? "", /Sign out/);

  await mounted.rerender(shell(true));
  const collapsedButton = mounted.container.querySelector(
    'aside form[action="/auth/signout"] button[type="submit"]',
  );

  assert.equal(collapsedButton?.getAttribute("title"), "Sign out");
  mounted.unmount();
});

function DirtyNavigation({ busy, desktop, discard }: { busy: boolean; desktop: boolean; discard: () => void }) {
  useWorkspaceUnsavedChanges(true, "split library", busy, discard);
  return desktop ? shell(false) : <AppTabBar activeView="split" benEnabled />;
}

test("mobile and desktop sign-out wait for saves and unsaved-edit approval", async () => {
  const originalSubmit = window.HTMLFormElement.prototype.submit;
  const originalReset = posthog.reset;
  const originalUrl = window.location.href;
  const originalState = window.history.state;
  try {
    for (const desktop of [false, true]) {
      const events: string[] = [];
      window.HTMLFormElement.prototype.submit = function (this: HTMLFormElement) {
        events.push(`${this.method.toUpperCase()} ${new URL(this.action).pathname}`);
      };
      posthog.reset = () => { events.push("reset"); };
      const discard = () => { events.push("discard"); };
      const mounted = await render(
        <WorkspaceNavigationProvider variant="training"><DirtyNavigation busy desktop={desktop} discard={discard} /></WorkspaceNavigationProvider>,
      );
      try {
        const selector = desktop ? 'aside form[action="/auth/signout"] button' : 'nav form[action="/auth/signout"] button';
        const signout = mounted.container.querySelector<HTMLButtonElement>(selector);
        assert.ok(signout);
        await mounted.click(signout);
        assert.deepEqual(events, []);
        let dialog = document.querySelector('.training-guard-panel[data-state="open"]');
        assert.ok(dialog);
        assert.equal([...dialog.querySelectorAll("button")].some(button => button.textContent === "Discard changes"), false);
        const keep = dialog.querySelector<HTMLButtonElement>("button");
        assert.ok(keep);
        await mounted.click(keep);
        await mounted.rerender(
          <WorkspaceNavigationProvider variant="training"><DirtyNavigation busy={false} desktop={desktop} discard={discard} /></WorkspaceNavigationProvider>,
        );
        await mounted.click(signout);
        dialog = document.querySelector('.training-guard-panel[data-state="open"]');
        assert.ok(dialog);
        const cancel = [...dialog.querySelectorAll("button")].find(button => button.textContent === "Keep editing");
        assert.ok(cancel);
        await mounted.click(cancel);
        assert.deepEqual(events, [], "cancel must neither sign out nor reset analytics");
        await mounted.click(signout);
        const leave = [...document.querySelectorAll<HTMLButtonElement>('.training-guard-panel[data-state="open"] button')].find(button => button.textContent === "Discard changes");
        assert.ok(leave);
        await mounted.click(leave);
        assert.deepEqual(events, ["discard", "reset", "POST /auth/signout"]);
      } finally {
        mounted.unmount();
      }
    }
  } finally {
    window.HTMLFormElement.prototype.submit = originalSubmit;
    posthog.reset = originalReset;
    window.history.replaceState(originalState, "", originalUrl);
  }
});
