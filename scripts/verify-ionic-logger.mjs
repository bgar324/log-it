import assert from "node:assert/strict";

export async function verifyIonicLogger(page, { origin, ownerToken, ownerId, artifactDir, workoutId }) {
  const key = `logit-ionic-workout-draft-v1:${ownerId}`;
  const writes = [];
  let saveResponse = "reject";
  await page.setRequestInterception(true);
  const intercept = request => {
    const url = new URL(request.url());
    if (url.origin === origin && !["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      writes.push({ path: url.pathname, method: request.method(), body: JSON.parse(request.postData() || "{}") });
      if (url.pathname === "/api/workouts" && request.method() === "POST") {
        void request.respond({ status: saveResponse === "success" ? 201 : 503, contentType: "application/json", body: JSON.stringify(saveResponse === "success" ? { id: workoutId, personalRecords: [] } : { error: "Verification: simulated network failure." }) });
      } else void request.abort();
    } else if (url.origin !== origin && request.method() !== "GET") void request.abort();
    else void request.continue();
  };
  page.on("request", intercept);
  const click = async text => {
    await page.waitForFunction(text => [...document.querySelectorAll("ion-button,button")].some(element => element.textContent.trim() === text && element.getBoundingClientRect().height > 0), {}, text);
    await page.evaluate(text => {
      const element = [...document.querySelectorAll("ion-button,button")].find(element => element.textContent.trim() === text && element.getBoundingClientRect().height > 0);
      if (!element) throw new Error(`Missing ${text}`);
      element.click();
    }, text);
  };
  try {
    await page.setCookie({ name: "logit_session", value: ownerToken, url: origin, httpOnly: true, secure: origin.startsWith("https:") });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(`${origin}/ionic/dashboard`, { waitUntil: "networkidle2" });
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.removeItem("logit-workout-draft-v2"); }, key);
    await page.goto(`${origin}/ionic/workouts/new`, { waitUntil: "networkidle2" });
    await page.waitForSelector(".ion-page ion-content", { timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null, "untouched visit must not save a draft");
    await page.goto(`${origin}/ionic/dashboard`, { waitUntil: "networkidle2" });
    const today = await page.evaluate(() => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
    const fixture = { version: 1, userId: ownerId, weightUnit: "LB", title: "Ionic verification", workoutType: "Push", performedAt: today,
      exercises: [{ id: "proof-exercise", name: "Bench Press", sets: [
        { id: "proof-set-1", reps: "8", weightLb: "135", usesBodyweight: false, durationSeconds: "", isCompleted: false },
        { id: "proof-set-2", reps: "7", weightLb: "135", usesBodyweight: false, durationSeconds: "", isCompleted: false },
      ] }], activeExerciseId: "proof-exercise", activeSetId: "proof-set-1" };
    await page.evaluate(({key,fixture}) => localStorage.setItem(key, JSON.stringify(fixture)), { key, fixture });
    await page.goto(`${origin}/ionic/workouts/new`, { waitUntil: "networkidle2" });
    await page.waitForSelector('[aria-label="Active exercise"]', { timeout: 60000 });
    await click("Complete set");
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.exercises[0].sets[0].isCompleted === true, {}, key);
    assert.equal(writes.length, 0, "completing a set must not create a workout");
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForSelector('[aria-label="Active exercise"]');
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).exercises[0].sets[0].isCompleted, key), true);
    await click("Finish workout");
    await page.waitForSelector("ion-alert");
    await click("Finish without them");
    await page.waitForFunction(() => [...document.querySelectorAll("ion-toast")].some(element => element.message?.includes("simulated network failure")));
    await page.waitForFunction(() => [...document.querySelectorAll("ion-alert")].every(element => !element.isOpen));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].body.exercises[0].sets.length, 1, "unfinished entered set must not be submitted");
    assert.equal(writes[0].body.exercises[0].sets[0].reps, 8);
    assert.ok(await page.evaluate(key => localStorage.getItem(key), key), "failed save must preserve draft");
    saveResponse = "success";
    await page.evaluate(() => {
      const retry = [...document.querySelector("ion-toast").shadowRoot.querySelectorAll("button")].find(button => button.textContent.trim() === "Retry");
      if (!retry) throw new Error("Retry action is missing");
      retry.click();
    });
    await page.waitForFunction(() => [...document.querySelectorAll("ion-alert")].some(element => element.isOpen && !element.classList.contains("overlay-hidden")));
    assert.equal(writes.length, 1, "Retry must re-confirm unfinished sets before submitting");
    await click("Finish without them");
    await page.waitForFunction(id => location.pathname === `/ionic/workouts/${id}`, {}, workoutId);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null, "success and pagehide must not resurrect draft");
    await page.screenshot({ path: `${artifactDir}/logger-success.png` });
    return { completedSetPersisted: true, unfinishedSetExcluded: true, failedSavePreservedDraft: true, successfulSaveClearedDraft: true, mutationsIntercepted: writes.length };
  } finally {
    page.off("request", intercept);
    await page.setRequestInterception(false);
  }
}
