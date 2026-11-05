import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiCombobox from "../../components/CuiCombobox.vue";
import type { ComboboxOption } from "../../components/CuiCombobox.vue";
import { frames, mountHosts } from "../../../../../config/test/browser-helpers";

// #347: a row action's keyboard route. Real key events, Alt+F as a "favorite" shortcut,
// with the highlighted row marked through the option slot's `highlighted` prop.
describe("CuiCombobox option-keydown (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  const options: ComboboxOption[] = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
    { value: "c", label: "Gamma" },
  ];

  it("reaches the highlighted option for Alt+F, and the highlighted slot prop follows the arrows", async () => {
    const favorites: (string | number)[] = [];
    const el = host({ position: "fixed", left: "20px", top: "20px", width: "240px" });
    track(
      mount(CuiCombobox, {
        attachTo: el,
        props: {
          options,
          "onOption-keydown": (e: KeyboardEvent, o: ComboboxOption) => {
            if (e.altKey && e.code === "KeyF") {
              e.preventDefault();
              favorites.push(o.value);
            }
          },
        },
        slots: { option: `<template #option="{ option, highlighted }"><i :data-hl="highlighted">{{ option.label }}</i></template>` },
      }),
    );
    await userEvent.click(el.querySelector("input")!);
    await frames(4);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    const marks = [...document.querySelectorAll("[data-hl]")].map((n) => n.getAttribute("data-hl"));
    expect(marks).toEqual(["false", "true", "false"]);
    await userEvent.keyboard("{Alt>}f{/Alt}");
    expect(favorites).toEqual(["b"]);
  });
});
