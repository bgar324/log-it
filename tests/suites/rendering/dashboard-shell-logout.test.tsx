import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { DashboardShell } from "@/app/dashboard/_components/dashboard-shell";
import { render } from "./render";

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
