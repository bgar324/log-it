import "./alias";
// Minimal DOM harness for component tests.
//
// jsdom globals must exist before react-dom is loaded, so this module is
// imported first by every rendering test and installs them as a side effect.
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const globalAny = globalThis as unknown as Record<string, unknown>;

// Node 24 defines `navigator` as a getter-only global, so it has to be
// redefined rather than assigned.
for (const name of ["window", "document", "navigator", "location"] as const) {
  Object.defineProperty(globalThis, name, {
    value: name === "window" ? dom.window : dom.window[name],
    configurable: true,
    writable: true,
  });
}

globalAny.HTMLElement = dom.window.HTMLElement;
globalAny.Element = dom.window.Element;
globalAny.Node = dom.window.Node;
globalAny.Event = dom.window.Event;
globalAny.MouseEvent = dom.window.MouseEvent;
globalAny.getComputedStyle = dom.window.getComputedStyle;
globalAny.requestAnimationFrame = (cb: FrameRequestCallback) =>
  dom.window.setTimeout(() => cb(Date.now()), 0) as unknown as number;
globalAny.cancelAnimationFrame = (id: number) => dom.window.clearTimeout(id);

// next/link's prefetch path reaches for `self` and requestIdleCallback, which
// jsdom does not provide.
globalAny.self = dom.window;
const idle = (cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) =>
  dom.window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0) as unknown as number;
globalAny.requestIdleCallback = idle;
globalAny.cancelIdleCallback = (id: number) => dom.window.clearTimeout(id);
(dom.window as unknown as Record<string, unknown>).requestIdleCallback = idle;
(dom.window as unknown as Record<string, unknown>).cancelIdleCallback = globalAny.cancelIdleCallback;
globalAny.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};
(dom.window as unknown as Record<string, unknown>).IntersectionObserver =
  globalAny.IntersectionObserver;

// React 19 checks this to decide whether act() warnings apply.
globalAny.IS_REACT_ACT_ENVIRONMENT = true;

// recharts' ResponsiveContainer sizes itself from the element box. jsdom has no
// layout engine and reports zeros, so charts render nothing unless we supply a
// box. Without this, chart tests fail for a reason that has nothing to do with
// the application.
const BOX = { width: 800, height: 400 };

Object.defineProperties(dom.window.HTMLElement.prototype, {
  offsetWidth: { get: () => BOX.width, configurable: true },
  offsetHeight: { get: () => BOX.height, configurable: true },
  clientWidth: { get: () => BOX.width, configurable: true },
  clientHeight: { get: () => BOX.height, configurable: true },
});

dom.window.Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    width: BOX.width,
    height: BOX.height,
    top: 0,
    left: 0,
    right: BOX.width,
    bottom: BOX.height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
};

// Fire the callback immediately on observe so ResponsiveContainer picks up a
// size on its first commit instead of waiting for a layout pass that never comes.
class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [{ target, contentRect: target.getBoundingClientRect() } as unknown as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }

  unobserve() {}
  disconnect() {}
}

globalAny.ResizeObserver = TestResizeObserver;
(dom.window as unknown as Record<string, unknown>).ResizeObserver = TestResizeObserver;

export { dom };
