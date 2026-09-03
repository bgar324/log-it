import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { AppShell, AppTabBar } from "@/app/components/app-nav";
import { DashboardShell } from "@/app/dashboard/_components/dashboard-shell";
import { render } from "./render";

const user = {
  displayName: "Test User",
  username: "test-user",
  avatarUrl: null,
};

test("the Ben phone bar replaces Nutrition with Split", async () => {
  const mounted = await render(
    createElement(AppTabBar, { activeView: "dashboard", benEnabled: true }),
  );
  const text = mounted.text();

  assert.match(text, /Split/);
  assert.doesNotMatch(text, /Nutrition/);
  assert.equal(
    mounted.findByText("a", "Split")?.getAttribute("href"),
    "/dashboard?view=split",
  );

  mounted.unmount();
});

test("the Ben phone drawer does not duplicate Split", async () => {
  const mounted = await render(
    <AppShell user={user} activeView="dashboard" benEnabled>
      <main />
    </AppShell>,
  );
  const drawer = mounted.container.querySelector('nav[data-app-nav="sections"]');

  assert.ok(drawer);
  assert.doesNotMatch(drawer.textContent ?? "", /Split/);
  assert.match(drawer.textContent ?? "", /Profile/);

  mounted.unmount();
});

test("the Ben desktop sidebar omits Nutrition and keeps Split", async () => {
  const mounted = await render(
    <DashboardShell
      activeView="dashboard"
      title="Home"
      user={user}
      benEnabled
      sidebarCollapsed={false}
      onToggleSidebar={() => {}}
      onNavigate={() => {}}
    >
      <div />
    </DashboardShell>,
  );
  const sidebar = mounted.container.querySelector("aside");

  assert.ok(sidebar);
  assert.doesNotMatch(sidebar.textContent ?? "", /Nutrition/);
  assert.match(sidebar.textContent ?? "", /Split/);

  mounted.unmount();
});

test("the standard interface keeps Nutrition and drawer Split", async () => {
  const mounted = await render(
    <AppShell user={user} activeView="dashboard" benEnabled={false}>
      <main />
    </AppShell>,
  );

  assert.match(mounted.container.querySelector('[data-app-nav="tabbar"]')?.textContent ?? "", /Nutrition/);
  assert.match(mounted.container.querySelector('[data-app-nav="sections"]')?.textContent ?? "", /Split/);

  mounted.unmount();
});
