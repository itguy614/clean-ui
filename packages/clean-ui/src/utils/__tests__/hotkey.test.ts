import { describe, it, expect } from "vitest";
import { matchesHotkey, parseHotkey } from "../hotkey";

const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);

describe("parseHotkey (#197)", () => {
  it("reads mod as Command on Apple platforms and Control elsewhere", () => {
    expect(parseHotkey("mod+k", true)).toMatchObject({ key: "k", meta: true, ctrl: false });
    expect(parseHotkey("mod+k", false)).toMatchObject({ key: "k", meta: false, ctrl: true });
  });

  it("reads every modifier name, in any case", () => {
    expect(parseHotkey("Ctrl+Alt+Shift+P", false)).toEqual({ key: "p", ctrl: true, alt: true, shift: true, meta: false });
    expect(parseHotkey("cmd+option+p", false)).toMatchObject({ meta: true, alt: true });
  });

  it("keeps the plus key", () => {
    expect(parseHotkey("mod++", false)).toMatchObject({ key: "+", ctrl: true });
  });

  it("is null without a key", () => {
    expect(parseHotkey("mod+", false)).toBeNull();
    expect(parseHotkey("", false)).toBeNull();
  });
});

describe("matchesHotkey", () => {
  const modK = parseHotkey("mod+k", false)!;

  it("matches the exact modifiers and key", () => {
    expect(matchesHotkey(key({ key: "k", ctrlKey: true }), modK)).toBe(true);
    expect(matchesHotkey(key({ key: "K", ctrlKey: true }), modK)).toBe(true);
  });

  it("does not match a missing or extra modifier, or another key", () => {
    expect(matchesHotkey(key({ key: "k" }), modK)).toBe(false);
    expect(matchesHotkey(key({ key: "k", ctrlKey: true, shiftKey: true }), modK)).toBe(false);
    expect(matchesHotkey(key({ key: "k", ctrlKey: true, metaKey: true }), modK)).toBe(false);
    expect(matchesHotkey(key({ key: "j", ctrlKey: true }), modK)).toBe(false);
  });

  it("falls back to the physical key when Alt changes the character", () => {
    const altK = parseHotkey("alt+k", false)!;
    expect(matchesHotkey(key({ key: "˚", code: "KeyK", altKey: true }), altK)).toBe(true);
  });
});
