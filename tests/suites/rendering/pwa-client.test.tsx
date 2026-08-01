import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
// render must load react-dom before NODE_ENV is switched below, so that the
// development build (the one act() needs) is the one that gets required.
import { render } from "./render";
import { PwaClient } from "../../../app/components/pwa-client";

type Registration = { scope: string };

function stubServiceWorker() {
  const calls: string[] = [];
  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    configurable: true,
    value: {
      register: (path: string) => {
        calls.push(path);
        return Promise.resolve({ scope: "/" } as Registration);
      },
      getRegistrations: () => Promise.resolve([]),
    },
  });
  return calls;
}

function setReadyState(state: DocumentReadyState) {
  Object.defineProperty(document, "readyState", {
    configurable: true,
    get: () => state,
  });
}

async function mountWith(readyState: DocumentReadyState) {
  const calls = stubServiceWorker();
  setReadyState(readyState);

  const env = process.env as Record<string, string | undefined>;
  const previousEnv = env.NODE_ENV;
  // The component gates registration on production. Flip it only for the mount,
  // after react-dom has already been loaded in development mode.
  env.NODE_ENV = "production";

  const mounted = await render(createElement(PwaClient));
  await new Promise((r) => setTimeout(r, 10));

  env.NODE_ENV = previousEnv;

  return { calls, mounted };
}

test("registers the service worker when load has already fired", async () => {
  // This is the real-world case: effects run after hydration, which is
  // routinely after the load event. A "load" listener added here never fires,
  // which silently disabled the PWA entirely.
  const { calls, mounted } = await mountWith("complete");

  assert.deepEqual(calls, ["/sw.js"], "expected an immediate registration");

  mounted.unmount();
});

test("still registers when load is yet to fire", async () => {
  const { calls, mounted } = await mountWith("loading");

  assert.deepEqual(calls, [], "must not register before load");

  window.dispatchEvent(new window.Event("load"));
  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(calls, ["/sw.js"], "expected registration once load fires");

  mounted.unmount();
});

test("unmounting before load removes the listener", async () => {
  const { calls, mounted } = await mountWith("loading");

  mounted.unmount();
  window.dispatchEvent(new window.Event("load"));
  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(calls, [], "a torn-down component must not register");
});
