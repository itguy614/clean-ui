import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick, type Component } from "vue";
import main from "../../styles/main.css?inline";
import CuiAccordion from "../../components/CuiAccordion.vue";
import CuiAccordionItem from "../../components/CuiAccordionItem.vue";
import CuiAlert from "../../components/CuiAlert.vue";
import CuiBadge from "../../components/CuiBadge.vue";
import CuiBanner from "../../components/CuiBanner.vue";
import CuiButton from "../../components/CuiButton.vue";
import CuiCard from "../../components/CuiCard.vue";
import CuiCheckboxGroup from "../../components/CuiCheckboxGroup.vue";
import CuiCheckbox from "../../components/CuiCheckbox.vue";
import CuiCodeBlock from "../../components/CuiCodeBlock.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiConfirmDialog from "../../components/CuiConfirmDialog.vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiDropdownSub from "../../components/CuiDropdownSub.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiFieldset from "../../components/CuiFieldset.vue";
import CuiFileUpload from "../../components/CuiFileUpload.vue";
import CuiInput from "../../components/CuiInput.vue";
import CuiInputStepper from "../../components/CuiInputStepper.vue";
import CuiList from "../../components/CuiList.vue";
import CuiListItem from "../../components/CuiListItem.vue";
import CuiModal from "../../components/CuiModal.vue";
import CuiPagination from "../../components/CuiPagination.vue";
import CuiPinInput from "../../components/CuiPinInput.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiRadio from "../../components/CuiRadio.vue";
import CuiRadioGroup from "../../components/CuiRadioGroup.vue";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiTabs from "../../components/CuiTabs.vue";
import CuiTab from "../../components/CuiTab.vue";
import CuiTagInput from "../../components/CuiTagInput.vue";
import CuiTextarea from "../../components/CuiTextarea.vue";
import CuiToast from "../../components/CuiToast.vue";
import CuiTooltip from "../../components/CuiTooltip.vue";
import CuiTreeView from "../../components/CuiTreeView.vue";
import baseline from "./radius-identity.baseline.json";

/**
 * #294 — decoupling `rounded="md"` from `--cui-button-radius`, and replacing the hand-written
 * `var(--cui-button-radius, var(--cui-radius-md, 0.375rem))` chains, must not change a single
 * corner at default settings. `radius-identity.baseline.json` holds the computed border radii
 * of every element each scenario renders, recorded from develop at 1.10.0 BEFORE the change:
 * every `rounded` value of every component that takes the prop (class names were later dropped from the descriptors, mechanically; `tabs-segmented` was added with the Tabs rule rewrite, its 6px track and 4px tabs checked by hand against develop's calc), and the default look of the
 * other components whose stylesheets carried a radius chain or a literal. Real browser: jsdom
 * computes none of this.
 *
 * To re-record, empty the baseline: each missing scenario prints its snapshot before failing.
 */

type Scenario = {
  make: () => Component;
  /** Click this (in the host or the document) before measuring, to open a panel. */
  open?: string;
  /** Run before measuring, once mounted. */
  after?: (host: HTMLElement) => Promise<void> | void;
};
const SCENARIOS: Record<string, Scenario> = {};
const add = (name: string, s: Scenario) => {
  SCENARIOS[name] = s;
};
const wrap = (component: Component, props: Record<string, unknown>, slots?: Record<string, () => unknown>): Component => ({
  render: () => h(component, props, slots as never),
});

const ROUNDED = ["none", "sm", "md", "lg", "full"] as const;
const opts = [{ value: "a", label: "Apple" }, { value: "b", label: "Banana" }];
const text = (s: string) => () => s;

// --- Components that take `rounded`: every value ---
for (const r of ROUNDED) {
  add(`alert-${r}`, { make: () => wrap(CuiAlert, { rounded: r, title: "T" }, { default: text("Body") }) });
  add(`badge-${r}`, { make: () => wrap(CuiBadge, { rounded: r }, { default: text("New") }) });
  add(`button-${r}`, { make: () => wrap(CuiButton, { rounded: r }, { default: text("Go") }) });
  add(`card-${r}`, { make: () => wrap(CuiCard, { rounded: r }, { default: text("Body") }) });
  add(`fieldset-${r}`, { make: () => wrap(CuiFieldset, { rounded: r, legend: "L", collapsible: true }, { default: text("Body") }) });
  add(`input-${r}`, {
    make: () => wrap(CuiInput, { modelValue: "x", rounded: r }, { "prefix-button": () => h(CuiButton, { size: "sm" }, text("A")), "suffix-button": () => h(CuiButton, { size: "sm" }, text("Go")) }),
  });
  add(`textarea-${r}`, { make: () => wrap(CuiTextarea, { modelValue: "x", rounded: r }) });
  add(`select-${r}`, { make: () => wrap(CuiSelect, { modelValue: "a", options: opts, rounded: r }) });
  add(`select-${r}-open`, { open: ".cui-select__trigger", make: () => wrap(CuiSelect, { modelValue: "a", options: opts, rounded: r }) });
  add(`combobox-${r}`, { make: () => wrap(CuiCombobox, { modelValue: "a", options: opts, rounded: r }) });
  add(`tag-input-${r}`, { make: () => wrap(CuiTagInput, { modelValue: ["a"], rounded: r }) });
  add(`list-inset-${r}`, {
    make: () => wrap(CuiList, { variant: "inset", rounded: r }, { default: () => [h(CuiListItem, text("One")), h(CuiListItem, text("Two"))] }),
  });
  add(`modal-${r}`, { make: () => wrap(CuiModal, { visible: true, rounded: r, title: "T" }, { default: text("Body") }) });
  add(`popover-${r}`, {
    make: () => wrap(CuiPopover, { visible: true, rounded: r, title: "T" }, { default: () => h("button", "Open"), content: text("Body") }),
  });
}

// --- Other components: the default look ---
add("accordion", {
  make: () => wrap(CuiAccordion, { modelValue: ["a"] }, { default: () => [h(CuiAccordionItem, { value: "a", label: "A" }, text("Body")), h(CuiAccordionItem, { value: "b", label: "B" }, text("Body"))] }),
});
add("banner-inline", { make: () => wrap(CuiBanner, { position: "inline", dismissible: true }, { default: text("Note") }) });
add("checkbox-group-error", {
  make: () => wrap(CuiCheckboxGroup, { modelValue: [], error: true, errorMessage: "No" }, { default: () => [h(CuiCheckbox, { value: "a", label: "A" }), h(CuiCheckbox, { value: "b", label: "B" })] }),
});
add("radio-group-error", {
  make: () => wrap(CuiRadioGroup, { modelValue: "a", error: true, errorMessage: "No" }, { default: () => [h(CuiRadio, { value: "a", label: "A" }), h(CuiRadio, { value: "b", label: "B" })] }),
});
add("radio-group-buttons", {
  make: () => wrap(CuiRadioGroup, { modelValue: "a", variant: "buttons" }, { default: () => [h(CuiRadio, { value: "a", label: "A" }), h(CuiRadio, { value: "b", label: "B" })] }),
});
add("code-block", { make: () => wrap(CuiCodeBlock, { code: "const a = 1;", language: "ts", copyable: true, lineNumbers: true }) });
add("confirm-dialog", { make: () => wrap(CuiConfirmDialog, { visible: true, title: "Sure?", message: "m", variant: "danger", confirmWord: "x" }) });
add("context-menu", {
  open: "#area",
  make: () =>
    wrap(CuiContextMenu, {}, {
      default: () => h("div", { id: "area", style: "width: 200px; height: 100px" }, "Area"),
      menu: () => [h(CuiDropdownItem, text("Rename")), h(CuiDropdownItem, text("Delete"))],
    }),
});
add("dropdown-menu", {
  open: ".cui-dropdown-trigger, button",
  make: () =>
    wrap(CuiDropdown, {}, {
      default: () => [
        h(CuiDropdownTrigger, () => h(CuiButton, text("Menu"))),
        h(CuiDropdownMenu, () => [h(CuiDropdownItem, text("One")), h(CuiDropdownSub, { label: "More" }, () => h(CuiDropdownItem, text("Two")))]),
      ],
    }),
});
add("file-upload", {
  make: () => wrap(CuiFileUpload, { label: "Files" }),
  after: async (host) => {
    const input = host.querySelector<HTMLInputElement>("input[type=file]")!;
    const dt = new DataTransfer();
    dt.items.add(new File(["x"], "a.txt", { type: "text/plain" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await nextTick();
  },
});
add("input-stepper", { make: () => wrap(CuiInputStepper, { modelValue: 3, label: "Qty" }) });
add("input-stepper-vertical", { make: () => wrap(CuiInputStepper, { modelValue: 3, orientation: "vertical" }) });
add("pagination", { make: () => wrap(CuiPagination, { currentPage: 2, totalPages: 9, perPage: 10, total: 90 }) });
add("pin-input", { make: () => wrap(CuiPinInput, { modelValue: "12", length: 4 }) });
add("tabs", {
  make: () => wrap(CuiTabs, { modelValue: "a" }, { default: () => [h(CuiTab, { value: "a", label: "A" }), h(CuiTab, { value: "b", label: "B" })] }),
});
add("tabs-segmented", {
  make: () => wrap(CuiTabs, { modelValue: "a", variant: "segmented" }, { default: () => [h(CuiTab, { value: "a", label: "A" }), h(CuiTab, { value: "b", label: "B" })] }),
});
add("toast", { make: () => wrap(CuiToast, { title: "T", description: "D", dismissible: true, showProgress: true, autoDismiss: 0 }) });
add("tooltip", { make: () => wrap(CuiTooltip, { text: "Tip", visible: true }, { default: () => h("button", "Trigger") }) });
add("tree-view", {
  make: () => wrap(CuiTreeView, { nodes: [{ id: 1, label: "A", children: [{ id: 2, label: "B" }] }] }),
});
add("data-grid-bulk-bar", {
  make: () =>
    wrap(CuiDataGrid, {
      columns: [{ key: "name", label: "Name" }],
      data: [{ id: "1", name: "A" }, { id: "2", name: "B" }],
      bulkActions: [{ key: "delete", label: "Delete" }],
      hideToolbar: false,
    }),
  after: async (host) => {
    host.querySelector<HTMLElement>("tbody .cui-checkbox")!.click();
    await nextTick();
    await new Promise((r) => setTimeout(r, 300));
    expect(host.querySelector(".cui-data-grid-bulk-bar"), "the bulk bar never opened").not.toBeNull();
  },
});

/**
 * Every element in the host — and anything teleported to the body — that has a rounded
 * corner, with all four radii, in document order.
 */
function snapshot(host: HTMLElement): string[] {
  const roots = [host, ...[...document.body.children].filter((el) => el !== host && el.className?.toString().includes("cui-"))];
  const out: string[] = [];
  for (const root of roots) {
    for (const el of [root, ...root.querySelectorAll("*")]) {
      const cs = getComputedStyle(el);
      const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
      if (radii.every((r) => r === "0px")) continue;
      // The tag, not the classes: a component may gain a class to carry a rule without that
      // being a change to how it looks.
      out.push(`${el.tagName.toLowerCase()} ${radii.join(" ")}`);
    }
  }
  return out;
}

function settle(root: Element) {
  for (const a of root.getAnimations({ subtree: true })) {
    if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
  }
}

describe("corner radii are unchanged at default settings (#294, real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens-294";
    style.textContent = main;
    document.head.append(style);
  });
  afterAll(() => document.getElementById("cui-tokens-294")?.remove());

  const wrappers: VueWrapper[] = [];
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    wrappers.splice(0).forEach((w) => w.unmount());
    hosts.splice(0).forEach((h) => h.remove());
  });

  const recorded = baseline as Record<string, string[]>;

  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    it(name, async () => {
      const host = document.createElement("div");
      document.body.append(host);
      hosts.push(host);
      wrappers.push(mount(scenario.make(), { attachTo: host }));
      await nextTick();
      await scenario.after?.(host);

      if (scenario.open) {
        const el = host.querySelector<HTMLElement>(scenario.open)!;
        expect(el, `nothing to open: ${scenario.open}`).toBeTruthy();
        if (name === "context-menu") el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }));
        else el.click();
        await nextTick();
        await new Promise((r) => setTimeout(r, 300));
      }
      await new Promise((r) => setTimeout(r, 30));
      settle(document.documentElement);

      const actual = snapshot(host);
      // `rounded="none"` renders no corner at all; anything else must show some.
      if (!name.includes("-none")) expect(actual.length, `${name} rendered nothing rounded`).toBeGreaterThan(0);
      if (!recorded[name]) console.log(`BASELINE ${JSON.stringify({ [name]: actual })}`);
      expect(recorded[name], `no recorded baseline for ${name}`).toBeDefined();
      expect(actual).toEqual(recorded[name]);
    });
  }

  it("records a baseline for every scenario, and no stale ones", () => {
    expect(Object.keys(recorded).sort()).toEqual(Object.keys(SCENARIOS).sort());
  });
});
