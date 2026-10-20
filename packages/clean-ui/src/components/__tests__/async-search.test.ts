import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiCombobox from "../CuiCombobox.vue";
import CuiTagInput from "../CuiTagInput.vue";

enableAutoUnmount(afterEach);
afterEach(() => vi.useRealTimers());

// #245, end to end in both components: a slower, older response never replaces a newer one.
const listed = () => [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent?.trim());

function slowThenFast() {
  const resolvers: Record<string, (v: Array<{ value: string; label: string }>) => void> = {};
  const fetch = vi.fn((q: string) => new Promise<Array<{ value: string; label: string }>>((r) => (resolvers[q] = r)));
  return { fetch, resolvers };
}

describe.each([
  ["CuiCombobox", (fetch: unknown) => mount(CuiCombobox, { attachTo: document.body, props: { fetchOptions: fetch as never, debounce: 50 } })],
  ["CuiTagInput", (fetch: unknown) => mount(CuiTagInput, { attachTo: document.body, props: { modelValue: [], allowCreate: false, fetchSuggestions: fetch as never, debounce: 50 } })],
])("%s async search", (_name, mountIt) => {
  it("shows the latest query's results even when an older response lands after them", async () => {
    vi.useFakeTimers();
    const { fetch, resolvers } = slowThenFast();
    const w = mountIt(fetch);
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("ab");
    vi.advanceTimersByTime(50);
    await input.setValue("abc");
    vi.advanceTimersByTime(50);
    resolvers.abc([{ value: "abc", label: "Result for abc" }]);
    await nextTick();
    resolvers.ab([{ value: "ab", label: "Result for ab" }]);
    await nextTick();
    await nextTick();
    expect(listed()).toEqual(["Result for abc"]);
  });
});

describe("CuiCombobox no-results text", () => {
  it("doesn't claim no results during the debounce, before anything was searched", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(async () => []);
    const w = mount(CuiCombobox, { attachTo: document.body, props: { fetchOptions: fetch, debounce: 200, noResultsText: "Nothing" } });
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("zz");
    expect(document.body.textContent).not.toContain("Nothing");
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();
    expect(document.body.textContent).toContain("Nothing");
  });
});

// Review of #245: resetting the query (a selection, a close) left the pending search for
// the old text running, which then fired and reopened the list under an empty input.
describe("a cleared query cancels its pending search", () => {
  it("CuiTagInput: Enter inside the debounce adds the tag and fetches nothing", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(async () => []);
    const w = mount(CuiTagInput, { attachTo: document.body, props: { modelValue: [], fetchSuggestions: fetch, debounce: 200 } });
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("foo");
    await input.trigger("keydown", { key: "Enter" });
    await vi.advanceTimersByTimeAsync(300);
    expect(w.emitted("update:modelValue")?.[0]).toEqual([["foo"]]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("CuiCombobox: closing inside the debounce fetches nothing", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(async () => []);
    const w = mount(CuiCombobox, { attachTo: document.body, props: { fetchOptions: fetch, debounce: 200 } });
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("foo");
    await input.trigger("keydown", { key: "Escape" });
    await vi.advanceTimersByTimeAsync(300);
    expect(fetch).not.toHaveBeenCalled();
  });
});
