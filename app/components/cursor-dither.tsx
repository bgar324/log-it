"use client";

import { useEffect, useRef } from "react";

export function CursorDither() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const state = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      tx: window.innerWidth * 0.5,
      ty: window.innerHeight * 0.5,
      visible: false,
    };

    let frameId = 0;

    const onPointerMove = (event: PointerEvent) => {
      state.tx = event.clientX;
      state.ty = event.clientY;
      state.visible = true;
    };

    const onPointerLeave = () => {
      state.visible = false;
    };

    const render = () => {
      state.x += (state.tx - state.x) * 0.18;
      state.y += (state.ty - state.y) * 0.18;

      layer.style.setProperty("--dither-x", `${state.x}px`);
      layer.style.setProperty("--dither-y", `${state.y}px`);
      layer.style.setProperty("--dither-opacity", state.visible ? "1" : "0");

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerMove);
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("mouseleave", onPointerLeave);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  return <div ref={layerRef} className="cursor-dither-layer" aria-hidden="true" />;
}
