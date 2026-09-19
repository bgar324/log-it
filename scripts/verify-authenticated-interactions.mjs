import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

// Run against an isolated authenticated Puppeteer page. Every mutation is
// intercepted, including analytics; success responses test client cleanup only.
export async function verifyAuthenticatedInteractions(page, { origin, sessionToken, artifactDir }) {
  const evidence = [];
  const writes = [];
  const errors = [];
  let mode = "fail";
  let pending;
  let originalDraft;
  let workoutId;
  const onError = error => errors.push(error.message);
  const intercept = request => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return void request.continue();
    const url = new URL(request.url());
    if (url.origin !== origin || !url.pathname.startsWith("/api/")) return void request.abort();
    writes.push({ path: url.pathname, method: request.method(), body: request.postData() });
    if (mode === "hold") { pending = request; return; }
    const success = mode === "success" && url.pathname === "/api/workouts" && request.method() === "PUT";
    void request.respond({ status: success ? 200 : 503, contentType: "application/json", body: JSON.stringify(success ? { id: workoutId, personalRecords: [] } : { error: "Verification blocked this write." }) });
  };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const hideDev = () => page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const go = async path => {
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle2" });
    assert.notEqual(new URL(page.url()).pathname, "/auth", "session expired");
    await hideDev();
  };
  const clickText = async (text, scope = "body", partial = false) => {
    const point = await page.evaluate(({ text, scope, partial }) => {
      const node = [...document.querySelector(scope).querySelectorAll("button,a")].find(node => {
        const label = node.textContent.trim();
        return (partial ? label.includes(text) : label === text) && node.getBoundingClientRect().height > 0;
      });
      if (!node) throw new Error(`Missing visible button: ${text}`);
      node.scrollIntoView({ block: "center" });
      const box = node.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }, { text, scope, partial });
    await page.mouse.click(point.x, point.y);
  };
  const replaceInput = async (selector, value) => {
    await page.click(selector);
    await page.evaluate(selector => document.querySelector(selector).select(), selector);
    await page.keyboard.type(value);
  };
  const closeMenu = async () => {
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector('.auth-popover-content[data-state="open"]'));
    await pause(240);
  };
  const record = (name, detail = {}) => evidence.push({ case: name, ...detail });
  const capture = async name => {
    await pause(300);
    await page.screenshot({ path: `${artifactDir}/${name}.png`, fullPage: true });
  };
  const theme = async value => page.evaluate(value => {
    localStorage.setItem("logit-theme", value);
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
  }, value);
  const viewport = width => page.setViewport({ width, height: width >= 900 ? 1000 : 844, deviceScaleFactor: 1, isMobile: width < 900, hasTouch: width < 900 });
  const waitForChart = async () => {
    await page.waitForFunction(() => {
      const chart = document.querySelector(".recharts-wrapper");
      const value = chart?.closest("section")?.querySelector("p")?.textContent;
      return chart && (Number.parseFloat(value ?? "") === 0 || [...chart.querySelectorAll(".recharts-bar-rectangle path")].some(node => node.getBoundingClientRect().height > 1 && getComputedStyle(node).fill !== "none"));
    });
    await pause(250);
  };
  const checkGeometry = async label => {
    const geometry = await page.evaluate(() => {
      const visible = node => { const box = node.getBoundingClientRect(); const style = getComputedStyle(node); return box.width > 0 && box.height > 0 && style.visibility !== "hidden"; };
      const inputs = [...document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea')].filter(visible);
      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        smallInputs: inputs.filter(node => parseFloat(getComputedStyle(node).fontSize) < 16).map(node => ({ label: node.getAttribute("aria-label") || node.name || node.type, size: getComputedStyle(node).fontSize })),
        smallTargets: [...document.querySelectorAll('button,nav a')].filter(visible).filter(node => { const b = node.getBoundingClientRect(); return b.width < 43.5 || b.height < 43.5; }).map(node => ({ label: node.getAttribute("aria-label") || node.textContent.trim(), width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })),
      };
    });
    assert.ok(geometry.scrollWidth <= geometry.width + 1, `${label}: horizontal overflow ${JSON.stringify(geometry)}`);
    if (geometry.width < 900) {
      assert.deepEqual(geometry.smallInputs, [], `${label}: iOS zoom risk`);
      assert.deepEqual(geometry.smallTargets, [], `${label}: undersized touch targets`);
    }
    record(label, geometry);
  };

  await mkdir(artifactDir, { recursive: true });
  page.on("pageerror", onError);
  page.on("request", intercept);
  await page.setRequestInterception(true);
  try {
    if (sessionToken) await page.setCookie({ name: "logit_session", value: sessionToken, url: origin, httpOnly: true, secure: origin.startsWith("https:"), sameSite: "Lax" });
    await viewport(390);
    await go("/dashboard");
    originalDraft = await page.evaluate(() => localStorage.getItem("logit-workout-draft-v2"));
    await page.evaluate(() => localStorage.removeItem("logit-workout-draft-v2"));
    await go("/dashboard");
    assert.ok(await page.$('[data-training-design="true"]'));
    assert.equal(await page.$('[data-workspace-design="nova"]'), null);
    assert.equal(await page.evaluate(() => document.querySelectorAll('[data-app-nav="tabbar"] a').length), 4);
    assert.ok(await page.$('a[aria-label="Profile"]'));
    assert.ok(await page.$('a[aria-label="Settings"]'));
    record("home-profile-settings-and-four-slot-dock");

    await go("/dashboard?view=workouts");
    await page.waitForSelector('[aria-label="Recorded days"] button[aria-pressed="true"]');
    await page.focus('button[aria-label="Filter workouts"]');
    await page.keyboard.press("Enter");
    await page.waitForSelector('.auth-popover-content[data-state="open"]');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Filter workouts");
    await closeMenu();
    await page.evaluate(() => document.querySelectorAll('[aria-label="Recorded days"] button[aria-pressed]')[1]?.click());
    await page.waitForFunction(() => document.querySelector('a[href*="/edit?from=workouts"]'));
    const history = await page.evaluate(() => ({ day: new URLSearchParams(location.search).get("day"), edit: document.querySelector('a[href*="/edit?from=workouts"]').getAttribute("href") }));
    workoutId = new URL(history.edit, origin).pathname.split("/")[2];
    assert.ok(history.day);
    await go(history.edit);
    await page.waitForSelector('input[aria-label="Set 1 reps"]');
    assert.equal(await page.evaluate(() => document.querySelectorAll('input[aria-label="Exercise name"]').length), 1);
    const firstName = await page.$eval('input[aria-label="Exercise name"]', node => node.value);
    const oldReps = await page.$eval('input[aria-label="Set 1 reps"]', node => node.value);
    const newReps = String(Number(oldReps || 8) + 1);
    await replaceInput('input[aria-label="Set 1 reps"]', newReps);
    await page.click('button[aria-label="Next exercise"]');
    await page.click('button[aria-label="Previous exercise"]');
    assert.equal(await page.$eval('input[aria-label="Exercise name"]', node => node.value), firstName);
    assert.equal(await page.$eval('input[aria-label="Set 1 reps"]', node => node.value), newReps);
    record("focused-exercise-switch-preserves-typed-set");
    const touch = await page.target().createCDPSession();
    const swipe = async (box, left) => {
      const start = left ? box.x + box.width - 12 : box.x + 12;
      const end = left ? box.x + 12 : box.x + box.width - 12;
      const y = box.y + box.height / 2;
      await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y, radiusX: 2, radiusY: 2 }] });
      for (let step = 1; step <= 8; step++) {
        await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + (end - start) * step / 8, y, radiusX: 2, radiusY: 2 }] });
        await pause(16);
      }
      await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await pause(240);
    };
    try {
      const headingBox = await page.$eval("main h1", node => { const b = node.getBoundingClientRect(); return { x: b.x, y: b.y, width: Math.min(b.width, 240), height: b.height }; });
      await swipe(headingBox, true);
      assert.notEqual(await page.$eval('input[aria-label="Exercise name"]', node => node.value), firstName);
      await swipe(headingBox, false);
      assert.equal(await page.$eval('input[aria-label="Exercise name"]', node => node.value), firstName);
      const inputBox = await page.$eval('input[aria-label="Set 1 reps"]', node => { const b = node.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
      await swipe(inputBox, true);
      assert.equal(await page.$eval('input[aria-label="Exercise name"]', node => node.value), firstName, "numeric fields must not trigger exercise swipes");
      record("touch-exercise-swipe-and-input-exclusion");
    } finally { await touch.detach(); }

    const rapid = await page.evaluate(async () => {
      const trigger = document.querySelector('[data-fab-trigger]');
      const box = trigger.getBoundingClientRect();
      let submits = 0;
      const count = () => submits++;
      document.querySelector("form").addEventListener("submit", count);
      trigger.click();
      await new Promise(resolve => setTimeout(resolve, 30));
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2).closest("button");
      const label = hit.getAttribute("aria-label") || hit.textContent.trim();
      hit.click();
      document.querySelector("form").removeEventListener("submit", count);
      return { label, submits };
    });
    assert.equal(rapid.label, "Close workout tools");
    assert.equal(rapid.submits, 0);
    record("rapid-tools-double-tap-never-submits", rapid);
    await page.focus('input[aria-label="Set 1 reps"]');
    const motion = await page.evaluate(async () => {
      const focused = document.activeElement;
      document.querySelector('[data-fab-trigger]').click();
      const frames = [];
      for (let i = 0; i < 12; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        frames.push([...document.querySelectorAll('button[title="Save changes"]')].map(node => ({ opacity: Number(getComputedStyle(node).opacity), transform: getComputedStyle(node).transform })));
      }
      return { frames, focusKept: document.activeElement === focused };
    });
    assert.equal(motion.focusKept, true);
    const circles = await page.evaluate(() => [...document.querySelector('[data-fab-trigger]').parentElement.querySelectorAll('button[title]')].map(node => { const b = node.getBoundingClientRect(); return { label: node.title, x: b.x, y: b.y, width: b.width, height: b.height }; }));
    assert.ok(motion.frames.some(frame => frame.some(node => node.opacity > 0 && node.opacity < 1)), "fan must animate, not snap");
    for (const box of circles) assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 391 && box.y + box.height <= 845, `fan out of viewport: ${JSON.stringify(box)}`);
    for (let i = 0; i < circles.length; i++) for (let j = i + 1; j < circles.length; j++) assert.ok(Math.hypot(circles[i].x - circles[j].x, circles[i].y - circles[j].y) >= 62, "fan hit targets overlap");
    await capture("logger-tools-fan");
    record("fan-animation-focus-and-arc", { motion, circles });
    await clickText("Save changes");
    await page.waitForFunction(() => document.body.textContent.includes("Verification blocked this write."));
    assert.equal(await page.$eval('input[aria-label="Set 1 reps"]', node => node.value), newReps);
    const savedAttempt = writes.find(write => write.path === "/api/workouts" && write.method === "PUT");
    assert.ok(savedAttempt);
    assert.equal(JSON.parse(savedAttempt.body).workoutId, workoutId);
    assert.equal(JSON.parse(savedAttempt.body).exercises[0].sets[0].reps, Number(newReps));
    record("failed-save-retains-edits-and-sends-real-payload");
    mode = "success";
    await page.click('[data-fab-trigger]');
    await pause(400);
    await clickText("Save changes");
    await page.waitForFunction(() => !location.pathname.endsWith("/edit"));
    assert.equal(new URL(page.url()).searchParams.get("day"), history.day);
    await clickText("Back");
    await page.waitForFunction(day => location.pathname === "/dashboard" && new URLSearchParams(location.search).get("day") === day, {}, history.day);
    await page.waitForFunction(day => document.querySelector('[aria-label="Recorded days"] button[aria-pressed="true"]')?.getAttribute("aria-label") && document.querySelector(`a[href*="day=${day}"]`), {}, history.day);
    record("simulated-save-cleans-editor-and-preserves-history-origin");
    mode = "fail";

    await go("/dashboard?view=progress");
    await page.waitForSelector('[aria-label="Period"]');
    const beforeGraph = await page.evaluate(() => document.querySelector(".recharts-surface")?.getAttribute("aria-label") || document.querySelector(".recharts-surface")?.textContent);
    await clickText("Year", '[aria-label="Period"]');
    await page.evaluate(() => [...document.querySelectorAll('button[aria-pressed]')].find(node => node.textContent.includes("Sets"))?.click());
    await waitForChart();
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('[aria-label="Period"] button')].find(node => node.textContent.trim() === "Year")?.getAttribute("aria-pressed")), "true");
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('button[aria-pressed]')].find(node => node.textContent.includes("Sets"))?.getAttribute("aria-pressed")), "true");
    assert.ok(await page.$(".recharts-surface"));
    record("analysis-period-and-metric-update", { beforeGraph });

    await go("/dashboard?view=split");
    await page.evaluate(() => [...document.querySelectorAll("button")].find(node => node.getAttribute("aria-label")?.includes(", today:")).click());
    await page.waitForSelector('input[aria-label="Exercise name"]');
    const workoutField = 'section input:not([aria-label])';
    const originalType = await page.$eval(workoutField, node => node.value);
    const originalExerciseCount = await page.evaluate(() => document.querySelectorAll('input[aria-label="Exercise name"]').length);
    await replaceInput(workoutField, `${originalType} check`);
    assert.equal(await page.evaluate(() => document.querySelectorAll('input[aria-label="Exercise name"]').length), originalExerciseCount);
    await page.click('button[aria-label="Back to week"]');
    mode = "hold";
    await clickText("Save split");
    await page.waitForFunction(() => document.body.textContent.includes("Saving"));
    await page.click('button[aria-label="Split options"]');
    await page.waitForSelector('.auth-popover-content[data-state="open"]');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll(".auth-popover-content button")].find(node => node.textContent.includes("Rename split"))?.disabled), true);
    await closeMenu();
    await page.click('[data-app-nav="tabbar"] a[href="/dashboard"]');
    await page.waitForSelector('.training-guard-panel[data-state="open"]');
    assert.equal(await page.evaluate(() => document.querySelector(".training-guard-panel").textContent.includes("Discard changes")), false);
    await clickText("Keep editing", ".training-guard-panel");
    assert.ok(pending, "split save was not intercepted");
    await pending.respond({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Verification blocked this write." }) });
    pending = undefined;
    mode = "fail";
    await page.waitForFunction(() => !document.querySelector(".training-guard-panel"));
    await clickText("All splits", "main", true);
    const folders = await page.evaluate(() => [...document.querySelectorAll("button[data-split-folder]")].map(node => ({ id: node.dataset.splitFolder, active: node.getAttribute("aria-label").includes("Active split.") })));
    assert.ok(folders.length >= 2, "cross-folder proof requires two existing saved splits");
    const inactive = folders.find(folder => !folder.active);
    const active = folders.find(folder => folder.active);
    await page.click(`button[data-split-folder="${inactive.id}"]`);
    await page.click('[data-app-nav="tabbar"] a[href="/dashboard"]');
    await page.waitForSelector('.training-guard-panel[data-state="open"]');
    assert.ok(await page.evaluate(() => document.querySelector(".training-guard-panel").textContent.includes("split library")));
    await clickText("Keep editing", ".training-guard-panel");
    await pause(240);
    await clickText("All splits", "main", true);
    await page.click(`button[data-split-folder="${active.id}"]`);
    assert.ok(await page.evaluate(type => [...document.querySelectorAll("button")].some(node => node.getAttribute("aria-label")?.includes(`${type} check`)), originalType));
    await page.click('[data-app-nav="tabbar"] a[href="/dashboard"]');
    await page.waitForSelector('.training-guard-panel[data-state="open"]');
    await clickText("Discard changes", ".training-guard-panel");
    await page.waitForFunction(() => new URLSearchParams(location.search).get("view") !== "split");
    record("split-failure-busy-rename-and-cross-folder-draft-protection");

    await go("/dashboard?view=split");
    await clickText("All splits", "main", true);
    await capture("split-folders");
    const folderSelector = `button[data-split-folder="${inactive.id}"]`;
    await page.$eval(folderSelector, node => node.scrollIntoView({ block: "center" }));
    const point = await page.$eval(folderSelector, node => { const b = node.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    const cdp = await page.target().createCDPSession();
    try {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...point, radiusX: 2, radiusY: 2 }] });
      await pause(600);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } finally { await cdp.detach(); }
    await page.waitForSelector('.auth-popover-content[data-state="open"]');
    assert.ok(await page.$('[aria-label="Saved splits"]'));
    await clickText("Set active", ".auth-popover-content");
    await page.waitForFunction(() => document.body.textContent.includes("Verification blocked this write."));
    const activation = writes.find(write => write.path === "/api/workout-split" && write.method === "PATCH");
    assert.ok(activation, "Set active must send its own activation request");
    assert.deepEqual(JSON.parse(activation.body), { id: inactive.id, action: "activate" });
    assert.ok(await page.$eval(`button[data-split-folder="${active.id}"]`, node => node.getAttribute("aria-label").includes("Active split.")));
    record("touch-folder-long-press-and-explicit-activation-failure");

    for (const width of [390, 1440, 320]) {
      await viewport(width);
      for (const color of ["dark", "light"]) {
        await theme(color);
        for (const view of ["dashboard", "workouts", "progress", "split", "profile", "settings"]) {
          await go(view === "dashboard" ? "/dashboard" : `/dashboard?view=${view}`);
          await theme(color);
          await pause(400);
          if (view === "progress") await waitForChart();
          await checkGeometry(`${view}-${width}-${color}`);
          if (width !== 320) await capture(`${view}-${width}-${color}`);
        }
        await go(`/workouts/${workoutId}/edit`);
        await theme(color);
        await checkGeometry(`logger-${width}-${color}`);
        if (width !== 320) await capture(`logger-${width}-${color}`);
      }
    }
    assert.deepEqual(errors, []);
    const report = { completed: true, evidence, writes: writes.map(({ path, method }) => ({ path, method })), forwardedMutations: 0, errors };
    await writeFile(`${artifactDir}/report.json`, JSON.stringify(report, null, 2));
    return report;
  } finally {
    if (pending && !pending.isInterceptResolutionHandled()) await pending.abort();
    await page.evaluate(draft => {
      if (draft === null || draft === undefined) localStorage.removeItem("logit-workout-draft-v2");
      else localStorage.setItem("logit-workout-draft-v2", draft);
    }, originalDraft).catch(() => {});
    page.off("pageerror", onError);
    page.off("request", intercept);
    await page.setRequestInterception(false);
    await writeFile(`${artifactDir}/progress.json`, JSON.stringify({ url: page.url(), evidence, writes: writes.map(({ path, method }) => ({ path, method })), errors }, null, 2));
  }
}
