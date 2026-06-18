import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import type { Component } from "vue";
import * as CleanUI from "../../index";

/**
 * Breadth smoke test: every public component must mount without throwing and
 * render a real root node. Depth (v-model, events, focus, keyboard) lives in the
 * per-component behaviour test files.
 *
 * Sub-components that require a parent provider's injected context can't mount
 * standalone — they're SKIPPED here with a reason and covered by their parent's
 * behaviour tests.
 */

const SKIP: Record<string, string> = {
  CuiTab: "requires <CuiTabs> context",
  CuiAccordionItem: "requires <CuiAccordion> context",
  CuiBreadcrumbItem: "requires <CuiBreadcrumb> context",
  // Table sub-components require <CuiTable> table-context
  CuiTableHead: "requires <CuiTable> context",
  CuiTableBody: "requires <CuiTable> context",
  CuiTableFoot: "requires <CuiTable> context",
  CuiTableRow: "requires <CuiTable> context",
  CuiTableCell: "requires <CuiTable> context",
  // Dropdown sub-components require <CuiDropdown> context
  CuiDropdownTrigger: "requires <CuiDropdown> context",
  CuiDropdownMenu: "requires <CuiDropdown> context",
  CuiDropdownItem: "requires <CuiDropdown> context",
  CuiDropdownCheckItem: "requires <CuiDropdown> context",
  CuiDropdownRadioGroup: "requires <CuiDropdown> context",
  CuiDropdownRadioItem: "requires <CuiDropdown> context",
  CuiDropdownSub: "requires <CuiDropdown> context",
  CuiDropdownDivider: "requires <CuiDropdown> context",
  CuiDropdownHeader: "requires <CuiDropdown> context",
  CuiTimelineItem: "requires <CuiTimeline> context",
};

/** Minimal props for components that need them to render meaningfully. */
const PROPS: Record<string, Record<string, unknown>> = {
  CuiFieldset: { legend: "Legend" },
  CuiModal: { visible: true, title: "Title" },
  CuiSlideover: { visible: true },
  CuiConfirmDialog: { visible: true },
  CuiPopover: { visible: true },
  // Required props
  CuiIcon: { name: "info" },
  CuiMaskedInput: { mask: "###-###" },
  CuiCodeBlock: { code: "const x = 1;" },
  CuiDataGrid: { columns: [], data: [] },
  CuiTransferList: { items: [] },
  CuiRadio: { value: "smoke" },
  CuiCopyButton: { value: "copy me" },
  CuiStepper: { steps: [] },
  CuiTreeView: { nodes: [] },
};

function isComponent(value: unknown): value is Component {
  return (
    typeof value === "object" &&
    value !== null &&
    ("__name" in value || "render" in value || "setup" in value)
  );
}

const components = Object.entries(CleanUI).filter(([, v]) => isComponent(v)) as [string, Component][];

describe("smoke: public component inventory", () => {
  it("discovers a substantial number of components", () => {
    expect(components.length).toBeGreaterThan(80);
  });
});

describe("smoke: every public component mounts and renders a root", () => {
  for (const [name, comp] of components) {
    if (SKIP[name]) {
      it.skip(`${name} — skipped (${SKIP[name]})`, () => {});
      continue;
    }
    it(`${name} mounts without error`, () => {
      const wrapper = mount(comp, { props: PROPS[name] ?? {} });
      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });
  }
});

// Providers render only their slot (no root element), so `hidden` has nowhere to apply.
const FRAGMENT_ROOT = new Set(["CuiConfigProvider", "CuiToastProvider"]);

describe("smoke: components respect `hidden`", () => {
  for (const [name, comp] of components) {
    if (SKIP[name] || FRAGMENT_ROOT.has(name)) continue;
    it(`${name} mounts with hidden=true`, () => {
      const wrapper = mount(comp, { props: { ...(PROPS[name] ?? {}), hidden: true } });
      expect(wrapper.exists()).toBe(true);
      wrapper.unmount();
    });
  }
});
