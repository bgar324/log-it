import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

/** Run on a dedicated owner session. Every mutation is intercepted, never forwarded. */
export async function verifyMotion(page, { origin, sessionToken, artifactDir }) {
  const evidence = [];
  const errors = [];
  const writes = [];
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const onError = error => errors.push(error.message);
  const intercept = request => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return void request.continue();
    writes.push({ method: request.method(), path: new URL(request.url()).pathname });
    if (new URL(request.url()).origin === origin && new URL(request.url()).pathname.startsWith("/api/")) {
      return void setTimeout(() => {
        void request.respond({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Motion verification blocked this write." }) }).catch(() => {});
      }, 350);
    }
    void request.abort();
  };
  const go = async path => {
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle2" });
    assert.equal(new URL(page.url()).origin, origin, "deployment protection redirected verification");
    assert.notEqual(new URL(page.url()).pathname, "/auth", "owner session expired");
  };
  const sample = async (selector, action, duration = 450) => {
    await page.evaluate(({ selector, duration }) => {
      window.__motionFrames = [];
      let start;
      const frame = time => {
        start ??= time;
        const element = document.querySelector(selector);
        if (element) {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          window.__motionFrames.push({ ms: time - start, opacity: Number(style.opacity), transform: style.transform, filter: style.filter, height: rect.height, x: rect.x, animation: style.animationName });
        }
        if (time - start < duration) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, { selector, duration });
    await action();
    await pause(duration + 100);
    return page.evaluate(() => window.__motionFrames);
  };
  const changing = (frames, field) => new Set(frames.map(frame => frame[field])).size > 2;
  const record = (name, result) => evidence.push({ name, ...result });
  await mkdir(artifactDir, { recursive: true });
  page.on("pageerror", onError);
  page.on("request", intercept);
  await page.setRequestInterception(true);
  try {
    await page.setCookie({ name: "logit_session", value: sessionToken, url: origin, httpOnly: true, secure: true, sameSite: "Lax" });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await go("/dashboard");
    const tabs = await sample('[data-app-nav-indicator]', () => page.click('[data-app-nav="tabbar"] a[aria-label="History"]'));
    assert.ok(changing(tabs, "transform"), "tab indicator must travel through intermediate positions");
    record("reference-sliding-tabs", { frames: tabs });
    await page.waitForSelector('a[href*="/edit?from=workouts"]');
    const editHref = await page.$eval('a[href*="/edit?from=workouts"]', node => node.getAttribute("href"));

    await go("/dashboard?view=split");
    await page.waitForSelector('button[data-split-folder][aria-current="true"]');
    const folderFrames = await sample('[data-editable].motion-page', () => page.click('button[data-split-folder][aria-current="true"]'));
    assert.ok(changing(folderFrames, "transform"), "folder opening must animate");
    assert.ok(folderFrames.every(frame => frame.filter === "none"), "editable values must not blur");
    record("split-forward-without-field-blur", { frames: folderFrames });
    const menuFrames = await sample('.auth-popover-content[data-state="open"]', () => page.click('button[aria-label="Split options"]'));
    assert.ok(changing(menuFrames, "opacity"), "menu entry must animate");
    record("reference-origin-menu", { frames: menuFrames });
    await page.keyboard.press("Escape");
    await pause(180);
    const backFrames = await sample('.motion-page[data-direction="back"]', () => page.click('header button[aria-label="Back to splits"]'));
    assert.ok(changing(backFrames, "transform"), "folder back must animate in the opposite direction");
    record("split-back", { frames: backFrames });

    await go(editHref);
    await page.waitForSelector('[data-exercise-active="true"] input[aria-label="Set 1 reps"]');
    await page.waitForFunction(() => Number.parseFloat(document.querySelector('[data-exercise-carousel] > .swiper-wrapper')?.style.height) > 0);
    const repsSelector = '[data-exercise-active="true"] input[aria-label="Set 1 reps"]';
    const reps = await page.$eval(repsSelector, node => node.value);
    await page.focus(repsSelector);
    const heightFrames = await sample('[data-exercise-carousel] > .swiper-wrapper', () => page.$eval('[data-exercise-active="true"]', node => [...node.querySelectorAll("button")].find(button => button.textContent.trim() === "Add set").click()));
    assert.ok(changing(heightFrames, "height"), "adding a set must resize through intermediate heights");
    assert.equal(await page.$eval(repsSelector, node => node.value), reps);
    record("reference-card-resize-preserves-values", { frames: heightFrames });

    const dialogFrames = await sample('.auth-dialog-content[data-state="open"]', () => page.click('button[aria-label="Reorder exercises"]'));
    assert.ok(changing(dialogFrames, "opacity"), "dialog entry must animate");
    const rows = await page.$$('[data-reorder-card]');
    assert.ok(rows.length >= 2, "owner workout needs at least two exercises for reorder proof");
    const beforeOrder = await page.$$eval('[data-reorder-id]', nodes => nodes.map(node => node.dataset.reorderId));
    await rows[0].click();
    const moveFrames = await sample('[data-reorder-card]', () => page.$$eval('[data-reorder-card]', nodes => nodes.at(-1).click()));
    const afterOrder = await page.$$eval('[data-reorder-id]', nodes => nodes.map(node => node.dataset.reorderId));
    assert.equal(afterOrder.at(-1), beforeOrder[0]);
    assert.ok(changing(moveFrames, "transform"), "row reordering must interpolate committed positions");
    record("reference-reorder-and-dialog", { dialogFrames, moveFrames });
    await page.keyboard.press("Escape");
    await pause(200);
    assert.equal(await page.$eval(repsSelector, node => node.value), reps);

    await page.click('button[aria-label="Next exercise"]');
    await pause(35);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    const interrupted = await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const root = document.querySelector('[data-exercise-carousel]');
      const active = root.querySelector('[data-exercise-active="true"]');
      return {
        delta: active.getBoundingClientRect().left - root.getBoundingClientRect().left,
        running: root.querySelector(".swiper-wrapper").getAnimations().filter(animation => animation.playState === "running").length,
      };
    });
    assert.ok(Math.abs(interrupted.delta) < 1, "reduced motion must settle the active exercise immediately");
    assert.equal(interrupted.running, 0, "changing CSS duration alone must not leave an existing transition running");
    await page.click('button[aria-label="Previous exercise"]');
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    assert.equal(await page.$eval(repsSelector, node => node.value), reps);
    record("reduced-motion-interrupts-paging", interrupted);

    const saveFrames = await sample('[aria-label="Workout actions"] .motion-state-enter', () => page.click('button[aria-label="Save changes"]'), 650);
    await page.waitForFunction(() => document.body.textContent.includes("Motion verification blocked this write."));
    assert.equal(await page.$eval(repsSelector, node => node.value), reps);
    assert.ok(writes.some(write => write.path === "/api/workouts" && write.method === "PUT"));
    assert.ok(changing(saveFrames, "filter"), "save feedback must use the reference text swap");
    assert.equal(await page.$('[aria-label="Workout actions"] .motion-state-exit'), null, "old status must leave the layout");
    record("save-error-keeps-values", { frames: saveFrames });

    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390 });
      for (const theme of ["light", "dark"]) {
        await go("/dashboard?view=split");
        await page.evaluate(theme => { localStorage.setItem("logit-theme", theme); document.documentElement.dataset.theme = theme; }, theme);
        await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
        await page.click('button[data-split-folder][aria-current="true"]');
        await pause(50);
        const reduced = await page.$eval('[data-editable].motion-page', node => ({ animation: getComputedStyle(node).animationName, filter: getComputedStyle(node).filter, overflow: document.documentElement.scrollWidth > innerWidth }));
        assert.equal(reduced.animation, "none");
        assert.equal(reduced.filter, "none");
        assert.equal(reduced.overflow, false);
        await page.click('button[aria-label="Split options"]');
        await pause(50);
        assert.ok(await page.$('.auth-popover-content[data-state="open"]'));
        await page.screenshot({ path: `${artifactDir}/split-${width}-${theme}-reduce.png` });
        await page.keyboard.press("Escape");
        record(`reduced-motion-${width}-${theme}`, reduced);
      }
    }
    assert.deepEqual(errors, []);
    const report = { completed: true, evidence, writes, forwardedMutations: 0, errors };
    await writeFile(`${artifactDir}/report.json`, JSON.stringify(report, null, 2));
    return report;
  } finally {
    // No dirty editor gets a chance to flush into a later verification session.
    await page.goto(`${origin}/dashboard`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.evaluate(() => localStorage.removeItem("logit-workout-draft-v2")).catch(() => {});
    page.off("pageerror", onError);
    page.off("request", intercept);
    await page.setRequestInterception(false);
    await writeFile(`${artifactDir}/progress.json`, JSON.stringify({ evidence, writes, errors }, null, 2));
  }
}
