import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiTagInput from "../CuiTagInput.vue";

describe("CuiTagInput", () => {
  it("appends a created tag to the v-model array on Enter", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: ["alpha"] },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.setValue("beta");
    await input.trigger("keydown", { key: "Enter" });

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual(["alpha", "beta"]);

    wrapper.unmount();
  });

  it("does not add a duplicate tag", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: ["alpha"] },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.setValue("alpha");
    await input.trigger("keydown", { key: "Enter" });

    // Already present -> addTag bails before emitting.
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();

    wrapper.unmount();
  });

  it("removes the last tag on Backspace with an empty query", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: ["alpha", "beta"] },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "Backspace" });

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual(["alpha"]);

    wrapper.unmount();
  });

  it("renders the createText label in the create-new dropdown row", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: [], createText: "Make tag" },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.trigger("focus");
    await input.setValue("gamma");
    await wrapper.vm.$nextTick();

    // Dropdown teleports to body.
    expect(document.body.textContent).toContain("Make tag");
    expect(document.body.textContent).toContain("gamma");

    wrapper.unmount();
  });

  it("does not create when allowCreate is false", async () => {
    const wrapper = mount(CuiTagInput, {
      props: { modelValue: [], allowCreate: false },
      attachTo: document.body,
    });

    const input = wrapper.find("input");
    await input.setValue("delta");
    await input.trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("update:modelValue")).toBeFalsy();

    wrapper.unmount();
  });
});

// #212: noSuggestionsText was declared, documented and read by nothing; there was no
// empty state at all.
describe("CuiTagInput empty state", () => {
  it("shows noSuggestionsText when the query matches nothing and nothing can be created", async () => {
    const w = mount(CuiTagInput, {
      attachTo: document.body,
      props: { modelValue: [], suggestions: [{ value: "apple" }], allowCreate: false, noSuggestionsText: "Nothing found" },
    });
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("zzz");
    expect(document.querySelector(".cui-listbox-status")?.textContent).toBe("Nothing found");
    expect(input.attributes("aria-expanded")).toBe("true");
    w.unmount();
  });

  it("offers the create row instead when allowCreate is on", async () => {
    const w = mount(CuiTagInput, {
      attachTo: document.body,
      props: { modelValue: [], suggestions: [{ value: "apple" }], allowCreate: true },
    });
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("zzz");
    expect(document.querySelector(".cui-listbox-status")).toBeNull();
    expect(document.querySelector(".cui-tag-input__create")).not.toBeNull();
    w.unmount();
  });
});

// Review of #212: with async suggestions, the empty state claimed "No suggestions" below
// minChars and during the debounce, before anything had been searched.
describe("CuiTagInput empty state with async suggestions", () => {
  it("waits for a search to come back for this query", async () => {
    vi.useFakeTimers();
    const fetchSuggestions = vi.fn(async () => []);
    const w = mount(CuiTagInput, {
      attachTo: document.body,
      props: { modelValue: [], allowCreate: false, minChars: 3, debounce: 200, fetchSuggestions },
    });
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("ab"); // below minChars
    expect(document.querySelector(".cui-listbox-status")).toBeNull();
    await input.setValue("abc"); // debounce pending: searching, not "nothing found"
    expect(document.body.textContent).not.toContain("No suggestions");
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();
    expect(document.querySelector(".cui-listbox-status")?.textContent).toBe("No suggestions");
    w.unmount();
    vi.useRealTimers();
  });
});
