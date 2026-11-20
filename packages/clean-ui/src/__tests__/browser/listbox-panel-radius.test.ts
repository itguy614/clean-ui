import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, type Component } from "vue";
import main from "../../styles/main.css?inline";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiTagInput from "../../components/CuiTagInput.vue";

/**
 * #522 — the listbox panel's corner chain is the explicit `--cui-<c>-panel-radius`, then the
 * field's own `--cui-<c>-radius`, then the `rounded` step. A consumer who squares the field
 * with its token gets a square panel. The panel is teleported to <body>, so the tokens are
 * set on `:root`, where both the field and the panel inherit them.
 *
 * Real browser: `var()` resolution through the cascade is the subject.
 */
const opts = [{ value: "a", label: "Apple" }, { value: "b", label: "Banana" }];
const CASES: Array<[string, string, Component, Record<string, unknown>, string, string]> = [
  ["select", "--cui-select", CuiSelect, { modelValue: "a", options: opts }, ".cui-select__trigger", ".cui-select__dropdown"],
  ["combobox", "--cui-combobox", CuiCombobox, { options: opts }, "input", ".cui-combobox__dropdown"],
  ["tag-input", "--cui-tag-input", CuiTagInput, { modelValue: [], suggestions: [{ value: "apple" }, { value: "banana" }] }, "input", ".cui-tag-input__dropdown"],
];

describe("the listbox panel follows the field's radius token (#522, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-listbox-panel-radius";
    style.textContent = main;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-listbox-panel-radius")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
    document.documentElement.removeAttribute("style");
  });

  async function panelRadius(component: Component, props: Record<string, unknown>, open: string, panel: string, rootStyle: string) {
    wrappers.splice(0).forEach((w) => w.unmount()); // one open panel at a time
    hosts.splice(0).forEach((h) => h.remove());
    document.documentElement.setAttribute("style", rootStyle);
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    wrappers.push(mount(component, { props, attachTo: host }));
    await nextTick();
    host.querySelector<HTMLElement>(open)!.click();
    await nextTick();
    await new Promise((r) => setTimeout(r, 300));
    const el = document.querySelector<HTMLElement>(panel);
    expect(el, `nothing matched ${panel}`).toBeTruthy();
    return getComputedStyle(el!).borderTopLeftRadius;
  }

  for (const [name, token, component, props, open, panel] of CASES) {
    it(`${name}: the field token squares the open panel`, async () => {
      expect(await panelRadius(component, props, open, panel, `${token}-radius: 0px`)).toBe("0px");
    });

    it(`${name}: the field token sets any corner`, async () => {
      expect(await panelRadius(component, props, open, panel, `${token}-radius: 13px`)).toBe("13px");
    });

    it(`${name}: the panel token still wins over the field token`, async () => {
      expect(await panelRadius(component, props, open, panel, `${token}-radius: 0px; ${token}-panel-radius: 9px`)).toBe("9px");
    });

    it(`${name}: with neither token the rounded step decides`, async () => {
      expect(await panelRadius(component, props, open, panel, "")).toBe("6px");
      expect(await panelRadius(component, { ...props, rounded: "full" }, open, panel, "")).toBe("8px");
    });
  }
});
