import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

// Run with a Puppeteer Page and short-lived session cookies. All server mutations
// are intercepted for the entire walkthrough, including errors and teardown.
export async function verifyIonicShell(page, { origin, ownerToken, otherToken, artifactDir }) {
  const blockedWrites = [];
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on("pageerror", onError);
  await page.setRequestInterception(true);
  const intercept = request => {
    const url = new URL(request.url());
    if (url.origin === origin && !["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      blockedWrites.push({ path: url.pathname, method: request.method() });
      void request.abort();
    } else if (url.origin !== origin && request.method() !== "GET") {
      void request.abort();
    } else void request.continue();
  };
  page.on("request", intercept);
  await mkdir(artifactDir, { recursive: true });
  const setSession = async value => {
    await page.setCookie({ name: "logit_session", value, url: origin, httpOnly: true, secure: origin.startsWith("https:"), sameSite: "Lax" });
  };
  try {
    await page.deleteCookie({ name: "logit_session", url: origin });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(`${origin}/auth`, { waitUntil: "networkidle2" });
    const anonymous = await page.evaluate(() => fetch("/api/ionic?resource=dashboard").then(r => r.status));
    assert.equal(anonymous, 401);
    await setSession(otherToken);
    await page.goto(`${origin}/ionic/dashboard`, { waitUntil: "networkidle2" });
    assert.equal(new URL(page.url()).pathname, "/dashboard");
    assert.equal(await page.$("[data-ionic-app]"), null);
    assert.equal(await page.evaluate(() => fetch("/api/ionic?resource=dashboard").then(r => r.status)), 403);
    await setSession(ownerToken);
    await page.goto(`${origin}/dashboard`, { waitUntil: "networkidle2" });
    assert.equal(new URL(page.url()).pathname, "/ionic/dashboard");
    await page.waitForSelector('[data-ionic-view="dashboard"] .ionic-content h2', { timeout: 60000 });
    for (const theme of ["light", "dark"]) {
      for (const width of [390, 1440]) {
        await page.setViewport({ width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390 });
        for (const view of ["dashboard", "workouts", "progress", "nutrition", "split", "profile", "settings"]) {
          await page.goto(`${origin}/ionic/${view}`, { waitUntil: "networkidle2" });
          await page.waitForSelector(`[data-ionic-view="${view}"] .ionic-content ion-list, [data-ionic-view="${view}"] .ionic-content h1, [data-ionic-view="${view}"] .ionic-content ion-input, [data-ionic-view="${view}"] .ionic-content ion-segment`, { timeout: 60000 });
          await page.evaluate(theme => { localStorage.setItem("logit-theme", theme); document.documentElement.dataset.theme = theme; document.documentElement.dataset.colorScheme = theme; }, theme);
          await new Promise(resolve => setTimeout(resolve, 1800));
          const measurements = await page.evaluate(() => {
            const active = document.querySelector(".ion-page:not(.ion-page-hidden) .ionic-content");
            const inputs = [...(active?.querySelectorAll("input,textarea,select") ?? [])].filter(element => element.getBoundingClientRect().height > 0);
            return {
              overflow: document.documentElement.scrollWidth > innerWidth,
              smallInputs: inputs.filter(element => parseFloat(getComputedStyle(element).fontSize) < 16).length,
              hasError: active?.textContent.includes("Unable to load this screen"),
            };
          });
          assert.equal(measurements.overflow, false, `${view} overflows at ${width}`);
          assert.equal(measurements.smallInputs, 0, `${view} has zoom-triggering inputs`);
          assert.equal(measurements.hasError, false, `${view} failed to load`);
          await page.screenshot({ path: `${artifactDir}/${view}-${theme}-${width}.png` });
        }
      }
    }
    assert.deepEqual(errors, [], "browser runtime errors");
    assert.deepEqual(blockedWrites, [], "read-only navigation unexpectedly attempted a mutation");
    return { anonymousStatus: 401, otherUserStatus: 403, ownerRedirect: "/ionic/dashboard", screenshots: 28, runtimeErrors: errors, blockedWrites };
  } finally {
    page.off("pageerror", onError);
    page.off("request", intercept);
    await page.setRequestInterception(false);
  }
}
