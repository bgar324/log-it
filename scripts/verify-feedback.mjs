import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

// The real authenticated UI, with every write intercepted before it can reach
// the shared database. Success responses prove client cleanup, not persistence.
export async function verifyFeedback(page, { origin, sessionToken, workoutId, artifactDir }) {
  const evidence = [];
  const writes = [];
  const errors = [];
  let mode = "fail";
  let pending;
  const failure = "Verification blocked this write.";
  const respond = (request, status, body) => request.respond({ status, contentType: "application/json", body: JSON.stringify(body) });
  const intercept = request => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method())) return void request.continue();
    const url = new URL(request.url());
    if (url.origin !== origin || !url.pathname.startsWith("/api/")) return void request.abort();
    writes.push({ path: url.pathname, method: request.method() });
    if (mode === "hold") { pending = request; return; }
    return void respond(request, mode === "conflict" ? 409 : 503, { error: failure });
  };
  const onError = error => errors.push(error.message);
  const awaitPending = async () => {
    for (let attempt = 0; attempt < 100 && !pending; attempt++) await pause(20);
    assert.ok(pending, "expected an intercepted pending write");
  };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const go = async path => {
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle2" });
    assert.notEqual(new URL(page.url()).pathname, "/auth", "session expired");
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  };
  const clickText = async (text, scope = "body") => {
    if (text === "Delete workout" && await page.$('button[aria-label="Workout options"]')) {
      await page.click('button[aria-label="Workout options"]');
      await pause(300);
    }
    const point = await page.evaluate(({ text, scope }) => {
      const node = [...document.querySelectorAll(`${scope} button,${scope} a`)].find(node => node.textContent.trim() === text && node.getBoundingClientRect().height > 0);
      if (!node) throw new Error(`Missing visible action: ${text}`);
      node.scrollIntoView({ block: "center" });
      const b = node.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }, { text, scope });
    await page.mouse.click(point.x, point.y);
  };
  const assertNoToast = async () => assert.equal(await page.$("[data-sonner-toaster],[data-sonner-toast]"), null);
  const assertFailure = async () => {
    await page.waitForFunction(message => [...document.querySelectorAll('[role="alert"]')].some(node => node.textContent.includes(message)), {}, failure);
    await assertNoToast();
  };
  const geometry = async label => {
    const observed = await page.evaluate(() => {
      const visible = node => node.getBoundingClientRect().height > 0 && getComputedStyle(node).visibility !== "hidden";
      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        smallInputs: [...document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]),select,textarea')].filter(visible).filter(node => parseFloat(getComputedStyle(node).fontSize) < 16).length,
        smallDialogTargets: [...document.querySelectorAll('[role="dialog"] button')].filter(visible).filter(node => node.getBoundingClientRect().height < 43.5).map(node => node.textContent.trim()),
      };
    });
    assert.ok(observed.scrollWidth <= observed.width + 1, `${label}: overflow`);
    assert.equal(observed.smallInputs, 0, `${label}: small input`);
    assert.equal(observed.smallDialogTargets.length, 0, `${label}: small dialog action`);
    evidence.push({ case: label, ...observed });
  };
  await mkdir(artifactDir, { recursive: true });
  page.on("pageerror", onError);
  page.on("request", intercept);
  await page.setRequestInterception(true);
  try {
    await page.setCookie({ name: "logit_session", value: sessionToken, url: origin, httpOnly: true, secure: origin.startsWith("https:"), sameSite: "Lax" });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await go(`/workouts/${workoutId}/edit`);
    const reps = '[data-exercise-active="true"] input[aria-label="Set 1 reps"]';
    await page.waitForSelector(reps);
    await page.click(reps);
    await page.$eval(reps, node => node.select());
    await page.keyboard.type("9");
    mode = "hold";
    await page.click('button[aria-label="Save changes"]');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Save changes"]')?.disabled);
    await assertNoToast();
    await awaitPending();
    mode = "fail";
    await respond(pending, 503, { error: failure });
    pending = undefined;
    await assertFailure();
    assert.equal(await page.$eval(reps, node => node.value), "9");
    await geometry("phone-save-error-retains-inputs");
    await page.screenshot({ path: `${artifactDir}/save-error.png`, fullPage: true });
    evidence.push({ case: "pending-save-on-control-without-toast" });
    mode = "hold";
    await page.click('button[aria-label="Save changes"]');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Save changes"]')?.disabled);
    await awaitPending();
    mode = "fail";
    await respond(pending, 200, { id: workoutId, personalRecords: [{ name: "Verification bench press", e1rmLb: 225 }] });
    pending = undefined;
    await page.waitForFunction(() => !location.pathname.endsWith("/edit"));
    await page.waitForFunction(() => document.body.textContent.includes("Verification bench press"));
    await assertNoToast();
    evidence.push({ case: "simulated-save-returns-with-workout-pr-summary" });
    await page.screenshot({ path: `${artifactDir}/saved-pr.png`, fullPage: true });

    await go("/dashboard");
    await page.evaluate(() => {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      localStorage.setItem("logit-workout-draft-v2", JSON.stringify({ title: "Verification draft", workoutType: "Push", performedAt: today, weightUnit: "LB", exercises: [{ name: "Bench press", sets: [{ reps: "8", weightLb: "185", usesBodyweight: false, durationSeconds: "" }] }] }));
    });
    await go("/workouts/new");
    await page.waitForSelector('button[aria-label="Save workout"]');
    mode = "conflict";
    await page.click('button[aria-label="Save workout"]');
    await assertFailure();
    assert.ok(await page.$eval(reps, node => node.value === "8"));
    await clickText("Discard draft");
    await page.waitForFunction(() => localStorage.getItem("logit-workout-draft-v2") === null);
    evidence.push({ case: "duplicate-error-keeps-draft-until-explicit-discard" });
    mode = "fail";

    await go(`/workouts/${workoutId}`);
    await clickText("Delete workout");
    await page.waitForSelector('[role="dialog"]');
    await pause(300);
    const beforeCancel = writes.length;
    await clickText("Cancel", '[role="dialog"]');
    assert.equal(writes.length, beforeCancel);
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await clickText("Delete workout");
    await page.waitForSelector('[role="dialog"]');
    await pause(300);
    mode = "hold";
    await clickText("Delete", '[role="dialog"]');
    await page.waitForFunction(() => document.querySelector('[role="dialog"] button:last-child')?.disabled);
    await page.keyboard.press("Escape");
    assert.ok(await page.$('[role="dialog"]'), "pending deletion must resist Escape");
    await awaitPending();
    mode = "fail";
    await respond(pending, 503, { error: failure });
    pending = undefined;
    await assertFailure();
    assert.ok(await page.$('[role="dialog"]'), "failed deletion must remain retryable");
    await geometry("phone-delete-error-dialog");
    await page.screenshot({ path: `${artifactDir}/delete-error.png`, fullPage: true });
    await clickText("Cancel", '[role="dialog"]');
    evidence.push({ case: "delete-cancel-busy-escape-and-inline-error" });

    await go("/dashboard?view=settings");
    const selected = await page.$eval("select", node => node.value);
    await page.select("select", selected === "LB" ? "KG" : "LB");
    await assertFailure();
    assert.equal(await page.$eval("select", node => node.value), selected, "failed preference must roll back");
    evidence.push({ case: "preference-error-visible-and-optimistic-unit-rolled-back" });

    await go("/dashboard?view=profile");
    await page.click('button[aria-label="Edit profile"]');
    await page.waitForSelector('[role="dialog"]');
    await pause(300);
    await clickText("Save changes", '[role="dialog"]');
    await assertFailure();
    assert.ok(await page.$('[role="dialog"]'), "failed profile save remains open");
    evidence.push({ case: "profile-error-in-editing-dialog" });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 64;
      canvas.getContext("2d").fillRect(0, 0, 64, 64);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], "verification.png", { type: "image/png" }));
      const input = document.querySelector('#profileAvatarImage');
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"] button')].some(node => node.textContent.trim() === "Apply photo" && !node.disabled));
    await pause(300);
    await clickText("Apply photo", '[role="dialog"]');
    await assertFailure();
    assert.ok(await page.$('[role="dialog"] img'), "failed upload retains crop for retry");
    evidence.push({ case: "avatar-upload-error-keeps-crop-and-dialog" });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));

    await clickText("Change");
    await page.click('input[type="email"]');
    await page.$eval('input[type="email"]', node => node.select());
    await page.type('input[type="email"]', "verification@example.invalid");
    await page.type('input[type="password"]', "verification-only-password");
    await clickText("Update email");
    await assertFailure();
    assert.equal(await page.$eval('input[type="email"]', node => node.value), "verification@example.invalid");
    evidence.push({ case: "email-error-inline-retains-input" });
    await clickText("Cancel");

    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390 });
      for (const theme of ["light", "dark"]) {
        await go("/dashboard?view=split");
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, theme);
        await assertNoToast();
        await geometry(`split-${width}-${theme}`);
        await page.screenshot({ path: `${artifactDir}/split-${width}-${theme}.png`, fullPage: true });
      }
    }

    await go("/dashboard?view=split");
    await page.waitForSelector('[aria-label="Saved splits"] button[aria-label^="Open "]');
    await page.click('[aria-label="Saved splits"] button[aria-label^="Open "]');
    await page.waitForSelector('input[aria-label="Workout name"]');
    const workoutName = 'input[aria-label="Workout name"]';
    await page.click(workoutName);
    await page.$eval(workoutName, node => node.select());
    await page.keyboard.type("Verification split day");
    await page.click('button[aria-label="Save split"]');
    await assertFailure();
    assert.equal(await page.$eval(workoutName, node => node.value), "Verification split day");
    evidence.push({ case: "failed-split-save-retains-day-input" });

    await go("/dashboard?view=split");
    await page.waitForSelector('button[aria-label^="Options for "]');
    await page.click('button[aria-label^="Options for "]');
    await clickText("Delete split");
    await page.waitForSelector('[role="dialog"]');
    await pause(300);
    const beforeSplitCancel = writes.length;
    await clickText("Cancel", '[role="dialog"]');
    assert.equal(writes.length, beforeSplitCancel);
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
    await page.click('button[aria-label^="Options for "]');
    await clickText("Delete split");
    await page.waitForSelector('[role="dialog"]');
    await pause(300);
    await clickText("Delete", '[role="dialog"]');
    await assertFailure();
    assert.ok(await page.$('[role="dialog"]'));
    evidence.push({ case: "split-delete-cancel-and-retryable-dialog-error" });
    await clickText("Cancel", '[role="dialog"]');
    assert.equal(errors.length, 0, `uncaught browser errors: ${errors.join("; ")}`);
    const proof = { evidence, interceptedWrites: writes, uncaughtErrors: errors, forwardedAppWrites: 0 };
    await writeFile(`${artifactDir}/proof.json`, JSON.stringify(proof, null, 2));
    return proof;
  } finally {
    if (pending) await pending.abort();
    await go("/dashboard");
    await page.evaluate(() => { localStorage.removeItem("logit-workout-draft-v2"); sessionStorage.clear(); });
    page.off("pageerror", onError);
    page.off("request", intercept);
    await page.setRequestInterception(false);
  }
}
