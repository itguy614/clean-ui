import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiCombobox from "../../components/CuiCombobox.vue";
import type { ComboboxOption, ComboboxOptionAction } from "../../components/CuiCombobox.vue";
import { frames, mountHosts } from "../../../../../config/test/browser-helpers";

// #445: grouped options and declarative optionActions, with real keys, real layout and the
// attributes a screen reader reads.
describe("CuiCombobox groups and optionActions (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  const options: ComboboxOption[] = [
    { value: "a", label: "Alpha", group: "Favorites" },
    { value: "b", label: "Beta", group: "Favorites" },
    { value: "c", label: "Gamma", group: "Others" },
    { value: "d", label: "Delta", group: "Others" },
  ];

  async function openList(props: Record<string, unknown>) {
    const el = host({ position: "fixed", left: "20px", top: "20px", width: "260px" });
    track(mount(CuiCombobox, { attachTo: el, props: { options, label: "Letters", ...props } }));
    const input = el.querySelector("input")!;
    await userEvent.click(input);
    await frames(4);
    return input;
  }
  const activeText = (input: HTMLInputElement) =>
    document.getElementById(input.getAttribute("aria-activedescendant")!)?.textContent?.trim();

  it("draws a heading per group above its options, and the arrows pass over the headings", async () => {
    const input = await openList({});
    const groups = [...document.querySelectorAll<HTMLElement>('[role="group"]')];
    expect(groups).toHaveLength(2);
    for (const g of groups) {
      const heading = document.getElementById(g.getAttribute("aria-labelledby")!)!;
      const firstOption = g.querySelector<HTMLElement>('[role="option"]')!;
      expect(heading.getAttribute("role")).toBeNull();
      expect(heading.getBoundingClientRect().bottom).toBeLessThanOrEqual(firstOption.getBoundingClientRect().top + 1);
      expect(heading.getBoundingClientRect().height).toBeGreaterThan(8);
    }
    const seen: (string | undefined)[] = [];
    for (let i = 0; i < 4; i++) {
      await userEvent.keyboard("{ArrowDown}");
      seen.push(activeText(input));
    }
    expect(seen).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(activeText(input)).toBe("Beta");
  });

  it("mergeGroups: real arrows walk the drawn order, and Enter picks the drawn option", async () => {
    const interleaved: ComboboxOption[] = [
      { value: "x1", label: "X1", group: "X" },
      { value: "y1", label: "Y1", group: "Y" },
      { value: "x2", label: "X2", group: "X" },
    ];
    const el = host({ position: "fixed", left: "20px", top: "20px", width: "240px" });
    let picked: unknown;
    track(mount(CuiCombobox, { attachTo: el, props: { options: interleaved, mergeGroups: true, "onUpdate:modelValue": (v: unknown) => (picked = v) } }));
    const input = el.querySelector("input")!;
    await userEvent.click(input);
    await frames(4);
    expect(document.querySelectorAll('[role="group"]')).toHaveLength(2);
    const seen: (string | undefined)[] = [];
    for (let i = 0; i < 3; i++) {
      await userEvent.keyboard("{ArrowDown}");
      seen.push(activeText(input));
    }
    expect(seen).toEqual(["X1", "X2", "Y1"]);
    await userEvent.keyboard("{Enter}");
    expect(picked).toBe("y1");
  });

  it("scrolls a group's heading into view when arrowing up to its first option", async () => {
    const many: ComboboxOption[] = ["A", "B", "C"].flatMap((g) =>
      [1, 2, 3, 4].map((n) => ({ value: `${g}${n}`, label: `${g}${n}`, group: `Group ${g}` })),
    );
    const input = await openList({ options: many, maxVisible: 4 });
    for (let i = 0; i < 12; i++) await userEvent.keyboard("{ArrowDown}");
    for (let i = 0; i < 7; i++) await userEvent.keyboard("{ArrowUp}"); // back up to B1, the first of its group
    await frames(2);
    expect(activeText(input)).toBe("B1");
    const panel = document.querySelector<HTMLElement>('[role="listbox"]')!;
    const heading = [...document.querySelectorAll<HTMLElement>(".cui-listbox-group__label")].find((h) => h.textContent === "Group B")!;
    expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(panel.getBoundingClientRect().top - 1);
  });

  it("restyles the heading through the public group tokens", async () => {
    await openList({});
    const heading = document.querySelector<HTMLElement>(".cui-listbox-group__label")!;
    const before = getComputedStyle(heading).color;
    const panel = document.querySelector<HTMLElement>(".cui-combobox__dropdown")!;
    panel.style.setProperty("--cui-combobox-group-color", "rgb(1, 2, 3)");
    expect(getComputedStyle(heading).color).not.toBe(before);
    expect(getComputedStyle(heading).color).toBe("rgb(1, 2, 3)");
  });

  it("runs an optionAction from the keyboard, with the label as the option's description", async () => {
    const hits: string[] = [];
    const optionActions: ComboboxOptionAction[] = [
      { key: "f", modifiers: ["alt"], label: "Favorite this option", onTrigger: (o) => hits.push(String(o.value)) },
    ];
    const input = await openList({ optionActions });
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    const option = document.getElementById(input.getAttribute("aria-activedescendant")!)!;
    const description = document.getElementById(option.getAttribute("aria-describedby")!)!;
    expect(description.textContent).toBe("Favorite this option");
    // Visually hidden, but not display:none, which would drop it from the accessibility tree.
    expect(getComputedStyle(description).display).not.toBe("none");
    expect(description.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    await userEvent.keyboard("{Alt>}f{/Alt}");
    expect(hits).toEqual(["b"]);
    expect(input.value).toBe(""); // Option+F typed nothing into the search
    // the arrows and Enter are unchanged
    await userEvent.keyboard("{ArrowDown}");
    expect(activeText(input)).toBe("Gamma");
  });
});
