// Tiny render helper. Deliberately not react-testing-library: the harness
// compiles with tsc to CommonJS and runs on node:test, and this is all the
// surface these tests need.
import "./dom";
import { createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

export type Mounted = {
  container: HTMLElement;
  root: Root;
  html: () => string;
  text: () => string;
  unmount: () => void;
  /** All elements matching a selector. */
  all: (selector: string) => HTMLElement[];
  /** First element whose trimmed text content contains `needle`. */
  findByText: (selector: string, needle: string) => HTMLElement | undefined;
  /** Click an element and flush the resulting React work. */
  click: (element: HTMLElement) => Promise<void>;
  /** Re-render with new props. */
  rerender: (next: ReactElement) => Promise<void>;
};

export async function render(element: ReactElement): Promise<Mounted> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  const mounted: Mounted = {
    container,
    root,
    html: () => container.innerHTML,
    text: () => container.textContent ?? "",
    all: (selector) => Array.from(container.querySelectorAll(selector)) as HTMLElement[],
    findByText: (selector, needle) =>
      (Array.from(container.querySelectorAll(selector)) as HTMLElement[]).find((node) =>
        (node.textContent ?? "").replace(/\s+/g, " ").includes(needle),
      ),
    click: async (target) => {
      await act(async () => {
        target.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      });
    },
    rerender: async (next) => {
      await act(async () => {
        root.render(next);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };

  return mounted;
}

export { createElement };
