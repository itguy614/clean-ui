import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";
import CuiSelect from "../CuiSelect.vue";
import CuiTransferList from "../CuiTransferList.vue";
import CuiFileUpload from "../CuiFileUpload.vue";
import CuiToggle from "../CuiToggle.vue";
import CuiPagination from "../CuiPagination.vue";

/**
 * #215 — the prose a component shows by default comes from the catalogue, so a provided
 * locale reaches it; an explicit prop still wins.
 */
function inLocale(messages: Record<string, unknown>, render: () => ReturnType<typeof h>) {
  return mount(defineComponent({ render: () => h(CuiConfigProvider, { messages }, render) }), { attachTo: document.body });
}

describe("prose defaults follow the message catalogue (#215)", () => {
  it("localises a prop default, and an explicit prop overrides it", () => {
    const w = inLocale({ select: { placeholder: "Auswählen…" } }, () => h(CuiSelect, { options: [] }));
    expect(w.find(".cui-select__placeholder").text()).toBe("Auswählen…");
    const own = inLocale({ select: { placeholder: "Auswählen…" } }, () => h(CuiSelect, { options: [], placeholder: "Pick one" }));
    expect(own.find(".cui-select__placeholder").text()).toBe("Pick one");
  });

  it("localises panel titles and empty text", () => {
    const w = inLocale({ transferList: { source: "Verfügbar", target: "Ausgewählt", empty: "Keine Einträge" } }, () =>
      h(CuiTransferList, { items: [], modelValue: [] }),
    );
    expect(w.text()).toContain("Verfügbar");
    expect(w.text()).toContain("Ausgewählt");
    expect(w.text()).toContain("Keine Einträge");
  });

  it("localises the drop zone", () => {
    const w = inLocale({ fileUpload: { drag: "Dateien hierher ziehen, oder", browse: "Durchsuchen" } }, () => h(CuiFileUpload));
    expect(w.text()).toContain("Dateien hierher ziehen, oder");
    expect(w.text()).toContain("Durchsuchen");
  });

  it("localises a literal in a template and an aria-label", () => {
    const t = inLocale({ toggle: { on: "AN" } }, () => h(CuiToggle, { modelValue: true, showLabels: true, size: "md" }));
    expect(t.find(".cui-toggle__on-label").text()).toBe("AN");
    const p = inLocale({ pagination: { label: "Seitennavigation" } }, () => h(CuiPagination, { totalItems: 50, perPage: 10 }));
    expect(p.find("nav").attributes("aria-label")).toBe("Seitennavigation");
  });
});
