import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

// Caller supplies an isolated, headless Puppeteer page and short-lived sessions.
// All writes are intercepted; this walkthrough never creates a server workout.
export async function verifyFocusedLogger(page, { origin, ownerToken, otherToken, artifactDir }) {
  await mkdir(artifactDir, { recursive: true });
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  let saveSucceeds = false;
  const writes = [];
  const errors = [];
  const onError = error => errors.push(error.message);
  const intercept = request => {
    const url = new URL(request.url());
    if (url.origin === origin && !["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      writes.push({ path: url.pathname, method: request.method(), body: JSON.parse(request.postData() || "{}") });
      if (url.pathname === "/api/workouts") {
        setTimeout(() => void request.respond({ status: saveSucceeds ? 201 : 503, contentType: "application/json", body: JSON.stringify(saveSucceeds ? { id: "intercepted-success", personalRecords: [] } : { error: "Verification: save interrupted." }) }).catch(() => {}), 200);
      } else void request.abort();
    } else if (url.origin !== origin && request.method() !== "GET") void request.abort();
    else void request.continue();
  };
  page.on("request", intercept);
  page.on("pageerror", onError);
  const session = value => page.setCookie({ name: "logit_session", value, url: origin, httpOnly: true, secure: origin.startsWith("https:") });
  const goto = async path => {
    await page.goto(origin + path, { waitUntil: "networkidle2", timeout: 60000 });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  };
  const clickText = async (text, scope = "body") => {
    await page.waitForFunction(({ text, scope }) => [...document.querySelectorAll(`${scope} button`)].some(e => e.textContent.trim() === text && e.getBoundingClientRect().height > 0), {}, { text, scope });
    await page.evaluate(({ text, scope }) => [...document.querySelectorAll(`${scope} button`)].find(e => e.textContent.trim() === text && e.getBoundingClientRect().height > 0).click(), { text, scope });
  };
  const fill = async (label, value) => {
    const selector = `input[aria-label="${label}"]`;
    await page.locator(selector).fill(value);
    assert.equal(await page.$eval(selector, input => input.value), value);
  };
  try {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await session(otherToken);
    await goto("/workouts/new");
    assert.equal(await page.$("[data-focused-logger]"), null);
    await session(ownerToken);
    await goto("/dashboard");
    assert.equal(new URL(page.url()).pathname, "/dashboard");
    assert.equal(await page.$("[data-ionic-app]"), null);
    await page.evaluate(() => localStorage.removeItem("logit-workout-draft-v2"));
    await goto("/workouts/new");
    await new Promise(resolve => setTimeout(resolve, 600));
    assert.equal(await page.evaluate(() => localStorage.getItem("logit-workout-draft-v2")), null);
    await goto("/dashboard");
    await page.evaluate(() => {
      const performedAt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      const set = (reps, weightLb) => ({ reps, weightLb, usesBodyweight: false, durationSeconds: "" });
      localStorage.setItem("logit-workout-draft-v2", JSON.stringify({ title: "Pull", workoutType: "Pull", performedAt, weightUnit: "LB", exercises: [
        { name: "Lat Pullover", sets: [set("8", "100"), set("7", "100")] },
        { name: "Machine Preacher Curl", sets: [set("7", "125"), set("6", "125")] },
        { name: "Rear Delt Fly", sets: [set("8", "40")] },
      ] }));
    });
    await goto("/workouts/new");
    await page.waitForSelector("[data-focused-logger=true]");
    assert.equal(await page.$$eval('input[aria-label$="reps"]', nodes => nodes.length), 2, "all sets of exactly one exercise are editable");
    await fill("Set 1 reps", "11");
    await page.click('button[aria-label="Open Machine Preacher Curl"]');
    await page.waitForSelector('input[aria-label="Exercise 2 name"]');
    await page.click('button[aria-label="Open Lat Pullover"]');
    assert.equal(await page.$eval('input[aria-label="Set 1 reps"]', input => input.value), "11");
    await page.click('button[aria-label="Add set"]');
    await page.waitForSelector('input[aria-label="Set 3 reps"]');
    await fill("Set 3 weight in lb", "100");
    await fill("Set 3 reps", "6");
    await page.focus('input[aria-label="Set 1 reps"]');
    const before = await page.evaluate(() => ({ id: document.activeElement.id, y: document.activeElement.getBoundingClientRect().y }));
    const tools = await (await page.$('button[aria-label="Tools"]')).boundingBox();
    await page.touchscreen.tap(tools.x + tools.width / 2, tools.y + tools.height / 2);
    await page.waitForSelector('[role="dialog"]');
    const after = await page.evaluate(() => ({ id: document.activeElement.id, y: document.activeElement.getBoundingClientRect().y }));
    assert.equal(after.id, before.id, "touch-open must not take focus from the set input");
    assert.ok(Math.abs(after.y - before.y) < 2, "opening the sheet must not jump the input");
    await page.keyboard.press("Enter");
    assert.equal(writes.length, 0, "Enter in a field behind Tools must not save the workout");
    await clickText("1m", '[role="dialog"]');
    await page.click('[role="dialog"] button[aria-label="Close"]');
    await page.waitForSelector('[role="dialog"]', { hidden: true });
    await page.waitForSelector('button[aria-label="Skip rest"]');
    await page.evaluate(() => {
      const realNow = Date.now;
      Date.now = () => realNow() + 90_000;
      window.dispatchEvent(new Event("pageshow"));
      Date.now = realNow;
    });
    await page.waitForSelector('button[aria-label="Skip rest"]', { hidden: true });
    await new Promise(resolve => setTimeout(resolve, 400));
    await page.reload({ waitUntil: "networkidle2" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.waitForSelector("[data-focused-logger=true]");
    assert.equal(await page.$eval('input[aria-label="Set 1 reps"]', input => input.value), "11");
    for (const theme of ["light", "dark"]) {
      for (const width of [390, 1440]) {
        await page.setViewport({ width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390 });
        await page.waitForSelector('button[type="submit"][form="focused-workout-logger-form"]');
        await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.colorScheme = theme; localStorage.setItem("logit-theme", theme); }, theme);
        await page.waitForFunction(() => document.querySelector("[data-focused-logger]")?.textContent.includes("Last hit"));
        await new Promise(resolve => setTimeout(resolve, 350));
        const size = await page.evaluate(() => {
          const save = document.querySelector('button[type="submit"][form="focused-workout-logger-form"]').getBoundingClientRect();
          return { overflow: document.documentElement.scrollWidth > innerWidth, saveVisible: save.top >= 0 && save.bottom <= innerHeight + 1, smallInputs: [...document.querySelectorAll("[data-focused-logger] input")].filter(e => e.getBoundingClientRect().height > 0 && parseFloat(getComputedStyle(e).fontSize) < 16).length };
        });
        assert.equal(size.overflow, false);
        assert.equal(size.saveVisible, true, "Save stays in the viewport");
        if (width < 620) assert.equal(size.smallInputs, 0, "phone inputs must not trigger Safari zoom");
        await page.screenshot({ path: `${artifactDir}/logger-${theme}-${width}.png` });
      }
    }
    await clickText("Save workout");
    await page.waitForFunction(() => document.querySelector("[data-focused-logger]").inert);
    await page.waitForFunction(() => document.body.innerText.includes("Verification: save interrupted."));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].body.exercises[0].sets[0].reps, 11);
    assert.equal(writes[0].body.exercises[0].sets.length, 3);
    assert.equal(writes[0].body.exercises[0].sets[2].weightLb, "100");
    assert.equal(writes[0].body.exercises.length, 3);
    assert.ok(await page.evaluate(() => localStorage.getItem("logit-workout-draft-v2")));
    saveSucceeds = true;
    await clickText("Save workout");
    await page.waitForFunction(() => location.pathname === "/dashboard" && new URLSearchParams(location.search).get("view") === "workouts");
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await new Promise(resolve => setTimeout(resolve, 450));
    assert.equal(await page.evaluate(() => localStorage.getItem("logit-workout-draft-v2")), null);
    assert.deepEqual(errors, []);
    return { ownerOnly: true, ionicOff: true, switchPreservesValues: true, addSetVisible: true, sheetPreservesFocus: true, timerUsesDeadline: true, restoredDraft: true, interruptedSavePreservesDraft: true, successfulSaveClearsDraft: true, interceptedWrites: writes.length, screenshots: 4 };
  } finally {
    page.off("request", intercept);
    page.off("pageerror", onError);
    await page.setRequestInterception(false);
  }
}
