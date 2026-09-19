import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { AppShell, AppTabBar, AppTopBar } from "@/app/components/app-nav";
import { DashboardShell } from "@/app/dashboard/_components/dashboard-shell";
import { render } from "./render";

const user = { displayName: "Test User", username: "test-user", avatarUrl: null };

test("the Ben phone bar exposes every owner destination directly and no Analysis", async () => {
  const mounted = await render(createElement(AppTabBar, { activeView: "workouts", benEnabled: true }));
  try {
    const links = mounted.all('nav[aria-label="Primary"] a');
    assert.deepEqual(links.map(link => link.getAttribute("aria-label")), ["Home", "History", "Split"]);
    assert.deepEqual(links.map(link => link.getAttribute("href")), ["/dashboard", "/dashboard?view=workouts", "/dashboard?view=split"]);
    assert.equal(links.find(link => link.getAttribute("aria-current") === "page")?.getAttribute("aria-label"), "History");
    assert.equal(mounted.container.querySelector('nav form[action="/auth/signout"]'), null);
    assert.equal(mounted.container.querySelector('nav button[aria-label="Sign out"]'), null);
  } finally { mounted.unmount(); }
});

test("the owner header has no drawer trigger or hidden navigation dialog", async () => {
  const mounted = await render(<AppShell user={user} activeView="dashboard" benEnabled><AppTopBar title="Home" /><main /></AppShell>);
  try {
    assert.equal(mounted.container.querySelector('button[aria-label="Open navigation"]'), null);
    assert.equal(mounted.container.querySelector('[role="dialog"][aria-label="Navigation"]'), null);
    assert.ok(mounted.container.querySelector('header a[aria-label="Profile"]'));
    assert.ok(mounted.container.querySelector('header a[aria-label="Settings"]'));
  } finally { mounted.unmount(); }
});

test("the Ben desktop sidebar omits Nutrition and Analysis and keeps Split", async () => {
  const mounted = await render(<DashboardShell activeView="dashboard" title="Home" user={user} benEnabled sidebarCollapsed={false} onToggleSidebar={() => {}} onNavigate={() => {}}><div /></DashboardShell>);
  try {
    const sidebar = mounted.container.querySelector("aside");
    assert.ok(sidebar);
    assert.doesNotMatch(sidebar.textContent ?? "", /Nutrition/);
    assert.doesNotMatch(sidebar.textContent ?? "", /Analysis/);
    assert.match(sidebar.textContent ?? "", /Split/);
  } finally { mounted.unmount(); }
});

test("the capability-aware bar retains both Nutrition and Split when needed", async () => {
  const mounted = await render(<AppShell user={user} activeView="dashboard" benEnabled={false}><main /></AppShell>);
  try {
    assert.ok(mounted.container.querySelector('nav a[aria-label="Nutrition"]'));
    assert.ok(mounted.container.querySelector('nav a[aria-label="Split"]'));
  } finally { mounted.unmount(); }
});

test("desktop navigation resets its own scrolling section", async () => {
  const view = (activeView: "workouts" | "split") => (
    <DashboardShell activeView={activeView} title="History" user={user} benEnabled sidebarCollapsed={false} onToggleSidebar={() => {}} onNavigate={() => {}}>
      <div />
    </DashboardShell>
  );
  const mounted = await render(view("workouts"));
  try {
    const scroller = mounted.container.querySelector<HTMLElement>("main > section");
    assert.ok(scroller);
    scroller.scrollTop = 400;
    await mounted.rerender(view("split"));
    assert.equal(scroller.scrollTop, 0);
    scroller.scrollTop = 300;
    const current = mounted.findByText("button", "Splits");
    assert.ok(current);
    await mounted.click(current);
    assert.equal(scroller.scrollTop, 0);
  } finally { mounted.unmount(); }
});
