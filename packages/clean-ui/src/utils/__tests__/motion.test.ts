import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { motionDuration, MOTION_DURATIONS, type MotionDuration } from "../motion";

// #261: the motion tokens live in main.css; motionDuration() is their one JS reader.
describe("motion tokens", () => {
  afterEach(() => document.documentElement.removeAttribute("style"));

  it("keeps MOTION_DURATIONS in step with the tokens main.css declares", () => {
    const css = readFileSync(resolve(__dirname, "../../styles/main.css"), "utf8");
    const declared = Object.fromEntries(
      [...css.matchAll(/--cui-duration-([a-z]+):\s*(\d+)ms;/g)].map(([, name, ms]) => [name, Number(ms)]),
    );
    expect(declared).toEqual(MOTION_DURATIONS);
  });

  it("falls back to the default where the token isn't set", () => {
    for (const name of Object.keys(MOTION_DURATIONS) as MotionDuration[]) {
      expect(motionDuration(name)).toBe(MOTION_DURATIONS[name]);
    }
  });

  it("reads an override, in ms or s, from the element it is given or the root", () => {
    document.documentElement.style.setProperty("--cui-duration-base", "0.5s");
    expect(motionDuration("base")).toBe(500);

    const el = document.createElement("div");
    el.style.setProperty("--cui-duration-fast", "80ms");
    document.body.append(el);
    expect(motionDuration("fast", el)).toBe(80);
    el.remove();
  });

  it("ignores a value that isn't a time", () => {
    document.documentElement.style.setProperty("--cui-duration-slow", "calc(2 * 100ms)");
    expect(motionDuration("slow")).toBe(MOTION_DURATIONS.slow);
  });
});
