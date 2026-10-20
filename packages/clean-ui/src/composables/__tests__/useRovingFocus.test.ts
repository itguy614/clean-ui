import { describe, it, expect, afterEach, vi } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref, useTemplateRef, type PropType } from "vue";
import { useRovingFocus } from "../useRovingFocus";
import { describeRovingFocusContract, press } from "./roving-focus-contract";

enableAutoUnmount(afterEach);

/** A fixture toolbar: buttons, with the composable wired the documented way. */
const Toolbar = defineComponent({
  props: {
    labels: { type: Array as PropType<string[]>, default: () => ["Bold", "Italic", "Underline", "Strike"] },
    disabled: { type: Array as PropType<number[]>, default: () => [] },
    orientation: { type: String as PropType<"horizontal" | "vertical">, default: "horizontal" },
    wrap: Boolean,
    typeahead: Boolean,
    start: { type: Number, default: 0 },
  },
  setup(props) {
    const container = useTemplateRef<HTMLElement>("bar");
    const roving = useRovingFocus({
      container,
      itemSelector: ".item",
      orientation: () => props.orientation,
      wrap: () => props.wrap,
      typeahead: () => props.typeahead,
      activeIndex: ref(props.start),
    });
    return () =>
      h("div", { ref: "bar", role: "toolbar", onKeydown: roving.onKeydown, onFocusin: roving.onFocusin }, [
        ...props.labels.map((label, i) =>
          h("button", { class: "item", tabindex: roving.tabIndex(i), disabled: props.disabled.includes(i) }, label),
        ),
        h("input", { class: "search" }),
      ]);
  },
});

const items = () => [...document.querySelectorAll<HTMLElement>(".item")];

describeRovingFocusContract("useRovingFocus fixture", {
  mount: () => mount(Toolbar, { attachTo: document.body }),
  items,
  orientation: "horizontal",
});

describe("useRovingFocus", () => {
  afterEach(() => vi.useRealTimers());

  it("starts the tab stop at the given index", async () => {
    mount(Toolbar, { props: { start: 2 }, attachTo: document.body });
    await nextTick();
    expect(items().map((el) => el.tabIndex)).toEqual([-1, -1, 0, -1]);
  });

  it("wraps when asked, and stops at the end when not", async () => {
    const w = mount(Toolbar, { attachTo: document.body });
    items()[3].focus();
    await press("ArrowRight");
    expect(document.activeElement).toBe(items()[3]);
    await w.setProps({ wrap: true });
    await press("ArrowRight");
    expect(document.activeElement).toBe(items()[0]);
  });

  it("skips disabled items, and moves the tab stop off one", async () => {
    mount(Toolbar, { props: { disabled: [0, 2] }, attachTo: document.body });
    await nextTick();
    expect(items()[1].tabIndex).toBe(0); // the stop left disabled item 0
    items()[1].focus();
    await press("ArrowRight");
    expect(document.activeElement).toBe(items()[3]);
  });

  it("swallows navigation keys, even at an end, and leaves others alone", async () => {
    mount(Toolbar, { attachTo: document.body });
    items()[0].focus();
    expect((await press("ArrowLeft")).defaultPrevented).toBe(true); // at the start: no page scroll
    expect((await press("Enter")).defaultPrevented).toBe(false);
    expect((await press("ArrowDown")).defaultPrevented).toBe(false); // cross axis
  });

  it("leaves keys in a nested control that isn't an item to it", async () => {
    mount(Toolbar, { attachTo: document.body });
    const search = document.querySelector<HTMLInputElement>(".search")!;
    search.focus();
    expect((await press("Home", search)).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(search);
  });

  it("moves the tab stop to an item that gains focus another way", async () => {
    mount(Toolbar, { attachTo: document.body });
    items()[2].focus();
    await nextTick();
    expect(items()[2].tabIndex).toBe(0);
    expect(items()[0].tabIndex).toBe(-1);
  });

  it("type-ahead moves to the next item starting with the letter, only when on", async () => {
    vi.useFakeTimers();
    const w = mount(Toolbar, { attachTo: document.body });
    items()[0].focus();
    await press("u");
    expect(document.activeElement).toBe(items()[0]);
    await w.setProps({ typeahead: true });
    await press("u");
    expect(document.activeElement).toBe(items()[2]);
  });

  it("follows right-to-left", async () => {
    mount(Toolbar, { attachTo: document.body });
    document.querySelector<HTMLElement>("[role=toolbar]")!.style.direction = "rtl";
    items()[0].focus();
    await press("ArrowLeft");
    expect(document.activeElement).toBe(items()[1]);
  });
});
