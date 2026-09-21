import "./dom";
import assert from "node:assert/strict";
import test from "node:test";
import { act, useState } from "react";
import { ExerciseSuggestions } from "@/app/components/exercise-suggestions";
import { render } from "./render";

function Picker({ selected }: { selected: string[] }) {
  const [name, setName] = useState("bic");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  return <ExerciseSuggestions fieldKey="exercise" suggestions={suggestions} onSelect={value => {
    selected.push(value);
    setName(value);
    setSuggestions([]);
  }}>
    <input aria-label="Exercise name" value={name} onChange={event => setName(event.target.value)}
      onFocus={() => setSuggestions(["Bicep Curls"])}
      onBlur={event => { setName(event.target.value); setSuggestions([]); }} />
  </ExerciseSuggestions>;
}

async function openPicker(selected: string[]) {
  const mounted = await render(<Picker selected={selected} />);
  const input = mounted.container.querySelector<HTMLInputElement>("input");
  assert.ok(input);
  await act(async () => { input.focus(); });
  const option = document.querySelector<HTMLButtonElement>('[aria-label="Exercise suggestions"] button');
  assert.ok(option);
  return { mounted, input, option };
}

function pointer(type: string, y = 100) {
  const event = new MouseEvent(type, {
    bubbles: true, cancelable: true, button: 0,
    clientX: 100, clientY: y, screenX: 100, screenY: y,
  });
  Object.defineProperties(event, {
    pointerId: { value: 1 }, pointerType: { value: "touch" }, isPrimary: { value: true },
  });
  return event;
}

test("a touch selection survives the input blurring before pointer-up", async () => {
  const selected: string[] = [];
  const { mounted, input, option } = await openPicker(selected);
  try {
    await act(async () => { option.dispatchEvent(pointer("pointerdown")); });
    await act(async () => { input.blur(); });
    await act(async () => { document.dispatchEvent(pointer("pointerup")); });
    assert.equal(input.value, "Bicep Curls");
    assert.equal(document.activeElement, input);
    assert.deepEqual(selected, ["Bicep Curls"]);
  } finally { mounted.unmount(); }
});

test("keyboard and assistive click activation still selects a suggestion", async () => {
  const selected: string[] = [];
  const { mounted, input, option } = await openPicker(selected);
  try {
    await mounted.click(option);
    assert.equal(input.value, "Bicep Curls");
    assert.deepEqual(selected, ["Bicep Curls"]);
  } finally { mounted.unmount(); }
});

test("starting or canceling a touch does not select an exercise", async () => {
  const selected: string[] = [];
  const { mounted, input, option } = await openPicker(selected);
  try {
    await act(async () => {
      option.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointercancel"));
      document.dispatchEvent(pointer("pointerup"));
    });
    assert.equal(input.value, "bic");
    assert.deepEqual(selected, []);
  } finally { mounted.unmount(); }
});

test("dragging a suggestion list does not apply the touched exercise", async () => {
  const selected: string[] = [];
  const { mounted, input, option } = await openPicker(selected);
  try {
    await act(async () => {
      option.dispatchEvent(pointer("pointerdown"));
      document.dispatchEvent(pointer("pointermove", 140));
      document.dispatchEvent(pointer("pointerup", 140));
    });
    assert.equal(input.value, "bic");
    assert.deepEqual(selected, []);
  } finally { mounted.unmount(); }
});

test("leaving the picker cancels a pending touch selection", async () => {
  const selected: string[] = [];
  const { mounted, option } = await openPicker(selected);
  await act(async () => { option.dispatchEvent(pointer("pointerdown")); });
  mounted.unmount();
  await act(async () => { document.dispatchEvent(pointer("pointerup")); });
  assert.deepEqual(selected, []);
});

test("a form that becomes inert cannot receive a pending selection", async () => {
  const selected: string[] = [];
  const { mounted, input, option } = await openPicker(selected);
  try {
    await act(async () => { option.dispatchEvent(pointer("pointerdown")); });
    mounted.container.setAttribute("inert", "");
    await act(async () => { document.dispatchEvent(pointer("pointerup")); });
    assert.equal(input.value, "bic");
    assert.deepEqual(selected, []);
  } finally { mounted.unmount(); }
});
