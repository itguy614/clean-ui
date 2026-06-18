import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { defaultMessages, mergeMessages } from "../../messages";
import { useMessages } from "../../composables/useMessages";
import CuiConfigProvider from "../CuiConfigProvider.vue";

// Minimal component that surfaces a couple of resolved messages.
const Probe = defineComponent({
  setup() {
    const messages = useMessages();
    return () =>
      h("div", [
        h("span", { class: "close" }, messages.value.close),
        h(
          "span",
          { class: "summary" },
          messages.value.pagination.summary({ from: 1, to: 10, total: 50 }),
        ),
      ]);
  },
});

describe("mergeMessages", () => {
  it("returns base unchanged when there is no override", () => {
    expect(mergeMessages(defaultMessages)).toBe(defaultMessages);
  });

  it("overrides a top-level atom and leaves the rest", () => {
    const m = mergeMessages(defaultMessages, { close: "Cerrar" });
    expect(m.close).toBe("Cerrar");
    expect(m.dismiss).toBe(defaultMessages.dismiss);
  });

  it("shallow-merges a nested namespace", () => {
    const m = mergeMessages(defaultMessages, { dataGrid: { filters: "Filtros" } });
    expect(m.dataGrid.filters).toBe("Filtros");
    expect(m.dataGrid.all).toBe(defaultMessages.dataGrid.all);
  });

  it("replaces a function-valued message wholesale", () => {
    const m = mergeMessages(defaultMessages, { pagination: { summary: () => "x" } });
    expect(m.pagination.summary({ from: 1, to: 2, total: 3 })).toBe("x");
    // sibling function untouched
    expect(m.pagination.perPage(10)).toBe(defaultMessages.pagination.perPage(10));
  });
});

describe("useMessages / CuiConfigProvider", () => {
  it("falls back to built-in English defaults with no provider", () => {
    const wrapper = mount(Probe);
    expect(wrapper.find(".close").text()).toBe("Close");
    expect(wrapper.find(".summary").text()).toBe("Showing 1 to 10 of 50 results");
  });

  it("resolves overrides from a CuiConfigProvider", () => {
    const wrapper = mount(CuiConfigProvider, {
      props: {
        messages: {
          close: "Cerrar",
          pagination: { summary: ({ from, to, total }) => `${from}–${to} de ${total}` },
        },
      },
      slots: { default: () => h(Probe) },
    });
    expect(wrapper.find(".close").text()).toBe("Cerrar");
    expect(wrapper.find(".summary").text()).toBe("1–10 de 50");
  });
});
