import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

// Supply an isolated Puppeteer page and short-lived session. Never forwards a
// mutation, including during teardown. This checks behavior, not class snapshots.
export async function verifyAuthenticatedInteractions(page, { origin, sessionToken, workoutId, artifactDir }) {
  const writes = [];
  const errors = [];
  const evidence = [];
  let originalDraft;
  const onError = error => errors.push(error.message);
  const intercept = request => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      const url = new URL(request.url());
      if (url.origin === origin && (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/"))) {
        writes.push({ path: url.pathname, method: request.method() });
      }
      void request.abort();
    } else void request.continue();
  };
  const go = async path => {
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle2" });
    assert.notEqual(new URL(page.url()).pathname, "/auth", "session expired");
  };
  const clickText = async (text, scope = "body") => {
    await page.evaluate(({ text, scope }) => {
      const button = [...document.querySelector(scope).querySelectorAll("button")]
        .find(node => node.textContent.trim() === text && node.getBoundingClientRect().height > 0);
      if (!button) throw new Error(`Missing visible button: ${text}`);
      button.click();
    }, { text, scope });
  };
  const waitOpen = selector => page.waitForSelector(`${selector}[data-state="open"]`, { visible: true });
  const closeSurface = async selector => {
    await page.keyboard.press("Escape");
    await page.waitForFunction(selector => !document.querySelector(`${selector}[data-state="open"]`), {}, selector);
    const closing = await page.evaluate(selector => {
      const node = document.querySelector(`${selector}[data-state="closed"]`);
      return node ? { pointerEvents: getComputedStyle(node).pointerEvents, inert: node.inert } : null;
    }, selector);
    if (closing) assert.ok(closing.inert || closing.pointerEvents === "none", "closing surface is interactive");
    await page.waitForFunction(selector => !document.querySelector(selector), {}, selector);
  };
  const dialog = ".auth-dialog-content";
  const menu = ".auth-popover-content";

  await mkdir(artifactDir, { recursive: true });
  page.on("pageerror", onError);
  page.on("request", intercept);
  await page.setRequestInterception(true);
  try {
    await page.setCookie({ name: "logit_session", value: sessionToken, url: origin, httpOnly: true, secure: origin.startsWith("https:"), sameSite: "Lax" });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await go("/dashboard");
    originalDraft = await page.evaluate(() => localStorage.getItem("logit-workout-draft-v2"));
    await page.evaluate(() => localStorage.removeItem("logit-workout-draft-v2"));
    assert.equal(await page.$('[data-workspace-design="nova"]'), null, "wrong rollout");
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

    // The revealed layer survives close; the returning app is protected until settled.
    await page.click('[data-app-drawer-trigger="true"]');
    await page.waitForFunction(() => {
      const drawer = document.querySelector('[role="dialog"][aria-label="Navigation"]');
      return drawer?.getAttribute("data-drawer") === "open" && getComputedStyle(drawer).translate === "0px";
    });
    await page.keyboard.press("Escape");
    const closingDrawer = await page.evaluate(() => {
      const node = document.querySelector('[role="dialog"][aria-label="Navigation"]');
      return { present: node.dataset.present, inert: node.inert, visibility: getComputedStyle(node).visibility };
    });
    assert.equal(closingDrawer.present, "true");
    assert.equal(closingDrawer.inert, true);
    assert.equal(closingDrawer.visibility, "visible");
    await page.waitForFunction(() => document.querySelector('[aria-label="Navigation"]').dataset.present === "false");
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
    evidence.push({ case: "drawer-close", ...closingDrawer });

    await go("/dashboard?view=workouts");
    await page.focus('button[aria-label="Filter workouts"]');
    await page.keyboard.press("Enter");
    await waitOpen(menu);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Filter workouts", "opening stole focus");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.querySelector(".auth-popover-content").contains(document.activeElement)), true, "Tab must enter the filter");
    await closeSurface(menu);
    evidence.push({ case: "history-filter-escape", passed: true });

    await go(`/workouts/${workoutId}`);
    await page.click('main button[aria-haspopup="dialog"]');
    await waitOpen(menu);
    await closeSurface(menu);
    evidence.push({ case: "detail-menu-escape", passed: true });
    const documentOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.click('button[aria-label="Workout options"]');
    await waitOpen(menu);
    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.waitForFunction(() => document.querySelector('button[aria-label="Workout options"]').getAttribute("aria-expanded") === "false");
    assert.equal(await page.evaluate(() => performance.timeOrigin), documentOrigin, "resize probe reloaded instead of closing");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    evidence.push({ case: "detail-menu-breakpoint-close", passed: true });

    await go("/dashboard?view=split");
    await page.click('button[aria-label="Split options"]');
    await waitOpen(menu);
    await closeSurface(menu);
    await clickText("Reorder");
    await waitOpen(dialog);
    await closeSurface(dialog);
    evidence.push({ case: "split-menu-and-week-reorder", passed: true });

    await go(`/workouts/${workoutId}/edit`);
    await page.waitForSelector('input[aria-label="Set 1 reps"]');
    await page.click('article button[aria-label$=" options"]');
    await waitOpen(menu);
    await closeSurface(menu);
    await page.click('article button[aria-label="Delete set 2"]');
    await waitOpen(dialog);
    const beforeSets = await page.evaluate(() => document.querySelectorAll('article:first-of-type button[aria-label^="Delete set"]').length);
    await closeSurface(dialog);
    assert.equal(await page.evaluate(() => document.querySelectorAll('article:first-of-type button[aria-label^="Delete set"]').length), beforeSets);
    await page.click('[data-fab-trigger="true"]');
    await clickText("Reorder exercises");
    await waitOpen(dialog);
    await closeSurface(dialog);
    evidence.push({ case: "logger-menus-confirmation-reorder", passed: true });

    await go("/dashboard?view=profile");
    await page.click('button[aria-label="Edit profile"]');
    await waitOpen(dialog);
    await closeSurface(dialog);
    await page.click('button[aria-label="Edit profile"]');
    await waitOpen(dialog);
    await closeSurface(dialog);
    await clickText("Delete account");
    await waitOpen(dialog);
    await closeSurface(dialog);
    evidence.push({ case: "profile-dialog-reopen-and-delete-cancel", passed: true });

    for (const gap of [0, 16, 50]) {
      await clickText("Delete account", "main");
      await waitOpen(dialog);
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.querySelector(".auth-dialog-content").contains(document.activeElement)), true, "Tab must enter the dialog");
      await page.focus(".auth-dialog-content input");
      await page.keyboard.type("audit");
      await page.keyboard.press("Escape");
      await new Promise(resolve => setTimeout(resolve, gap));
      await clickText("Delete account", "main");
      await page.waitForFunction(() => document.querySelector('.auth-dialog-content[data-state="open"] input')?.value === "");
      await closeSurface(dialog);
    }
    evidence.push({ case: "rapid-confirmation-reopen", gaps: [0, 16, 50], passed: true });

    if (await page.$('button[aria-label="Edit profile photo"]')) {
      await page.click('button[aria-label="Edit profile photo"]');
      await waitOpen(dialog);
      await page.waitForFunction(() => document.querySelector(".auth-dialog-content img")?.naturalWidth > 0);
      for (const gap of [0, 16, 50]) {
        await page.focus('.auth-dialog-content input[type="range"]');
        await page.keyboard.press("End");
        await page.keyboard.press("Escape");
        await new Promise(resolve => setTimeout(resolve, gap));
        await page.evaluate(() => document.querySelector('button[aria-label="Edit profile photo"]').click());
        await page.waitForFunction(() => document.querySelector('.auth-dialog-content[data-state="open"] input[type="range"]')?.value === "1" && document.querySelector(".auth-dialog-content img")?.naturalWidth > 0);
        const imageWidth = await page.$eval(".auth-dialog-content img", node => node.getBoundingClientRect().width);
        await page.focus('.auth-dialog-content input[type="range"]');
        await page.keyboard.press("End");
        await page.waitForFunction(width => document.querySelector(".auth-dialog-content img").getBoundingClientRect().width > width * 1.3, {}, imageWidth);
      }
      await closeSurface(dialog);
      evidence.push({ case: "rapid-avatar-reopen-and-zoom", passed: true });
    }

    // No JS exit timer may keep a reduced-motion surface alive after CSS finishes.
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.click('button[aria-label="Edit profile"]');
    await waitOpen(dialog);
    await closeSurface(dialog);
    await page.emulateMediaFeatures([]);
    evidence.push({ case: "reduced-motion-dismissal", passed: true });

    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390 });
      for (const path of ["/dashboard?view=workouts", "/dashboard?view=progress", "/dashboard?view=split", `/workouts/${workoutId}/edit`]) {
        await go(path);
        await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
        if (path.includes("view=progress")) await new Promise(resolve => setTimeout(resolve, 1800));
        for (const theme of ["light", "dark"]) {
          await page.evaluate(theme => {
            document.documentElement.dataset.theme = theme;
            document.documentElement.dataset.colorScheme = theme;
          }, theme);
          const geometry = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth > innerWidth,
            smallInputs: [...document.querySelectorAll("input:not([type=hidden]),select,textarea")]
              .filter(node => node.getBoundingClientRect().height > 0 && parseFloat(getComputedStyle(node).fontSize) < 16).length,
          }));
          await new Promise(resolve => setTimeout(resolve, 200));
          assert.equal(geometry.overflow, false, `${path} overflows at ${width}`);
          if (width === 390) assert.equal(geometry.smallInputs, 0, `${path} can zoom the phone viewport`);
          const label = path.includes("/edit") ? "logger" : new URL(path, origin).searchParams.get("view");
          await page.screenshot({ path: `${artifactDir}/${label}-${width}-${theme}.png` });
        }
      }
    }
    assert.deepEqual(writes, [], "walkthrough attempted an application mutation");
    assert.deepEqual(errors, [], "browser runtime errors");
    return { evidence, screenshots: 16, writes, errors };
  } finally {
    await go("/dashboard").catch(() => {});
    if (originalDraft !== undefined) {
      await page.evaluate(value => {
        if (value === null) localStorage.removeItem("logit-workout-draft-v2");
        else localStorage.setItem("logit-workout-draft-v2", value);
      }, originalDraft).catch(() => {});
    }
    page.off("pageerror", onError);
    page.off("request", intercept);
    await page.setRequestInterception(false);
  }
}
