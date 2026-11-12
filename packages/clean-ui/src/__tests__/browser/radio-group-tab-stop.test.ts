import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h, nextTick, ref } from "vue";
import CuiFormField from "../../components/CuiFormField.vue";
import CuiRadio from "../../components/CuiRadio.vue";
import CuiRadioGroup from "../../components/CuiRadioGroup.vue";
import { mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #231. A radio group is one tab stop. Focus order and real key handling are things jsdom
 * doesn't model, so a real browser with real Tab and arrow presses.
 */
describe("CuiRadioGroup single tab stop (real browser, #231)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  interface Opts {
    value?: string;
    variant?: "default" | "buttons";
    disabled?: string[];
    readonly?: boolean;
    groupDisabled?: boolean;
    inField?: boolean;
  }

  function render(o: Opts = {}) {
    const model = ref<string | undefined>(o.value);
    const ids = ["a", "b", "c", "d", "e"];
    const radios = () =>
      ids.map((id) =>
        h(CuiRadio, { key: id, id: `r-${id}`, value: id, label: id.toUpperCase(), disabled: o.disabled?.includes(id) }),
      );
    const group = () =>
      h(
        CuiRadioGroup,
        {
          modelValue: model.value,
          "onUpdate:modelValue": (v: unknown) => (model.value = v as string),
          variant: o.variant,
          readonly: o.readonly,
          disabled: o.groupDisabled,
          label: "Fruit",
        },
        radios,
      );
    const wrapper = track(
      mount(
        defineComponent({
          setup: () => () =>
            h("form", [
              h("input", { id: "before" }),
              o.inField ? h(CuiFormField, { label: "Fruit" }, group) : group(),
              h("input", { id: "after" }),
            ]),
        }),
        { attachTo: host({}) },
      ),
    );
    const el = (id: string) => document.getElementById(id)!;
    const radio = (id: string) => el(`r-${id}`);
    return { wrapper, model, el, radio };
  }

  /** The ids Tab visits between #before and #after. */
  async function tabStops(el: (id: string) => HTMLElement): Promise<string[]> {
    el("before").focus();
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      await userEvent.tab();
      const id = document.activeElement?.id ?? "";
      if (id === "after") return seen;
      seen.push(id);
    }
    return seen;
  }

  it("enters on the first radio with none checked, and leaves on the next Tab", async () => {
    const { el, radio } = render();
    expect(["a", "b", "c", "d", "e"].filter((id) => radio(id).tabIndex === 0)).toEqual(["a"]);
    expect(await tabStops(el)).toEqual(["r-a"]);
  });

  it("enters on the checked radio, in the middle", async () => {
    const { el } = render({ value: "c" });
    expect(await tabStops(el)).toEqual(["r-c"]);
  });

  it("skips a disabled first radio, and a disabled checked one", async () => {
    const first = render({ disabled: ["a"] });
    expect(await tabStops(first.el)).toEqual(["r-b"]);
    cleanup();
    const checked = render({ value: "c", disabled: ["c"] });
    expect(await tabStops(checked.el)).toEqual(["r-a"]);
  });

  it("moves and selects with arrows, skipping a disabled radio and wrapping", async () => {
    const { el, radio, model } = render({ value: "a", disabled: ["b"] });
    el("before").focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(radio("a"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(radio("c"));
    expect(model.value).toBe("c");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(document.activeElement).toBe(radio("e"));
    expect(model.value).toBe("e");
    await userEvent.keyboard("{Home}");
    expect(model.value).toBe("a");
    await userEvent.keyboard("{End}");
    expect(model.value).toBe("e");
    await nextTick();
    expect(radio("e").tabIndex).toBe(0);
    expect(radio("a").tabIndex).toBe(-1);
  });

  it("returns to the checked radio on Shift+Tab from the next field", async () => {
    const { el, radio, model } = render();
    el("before").focus();
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(model.value).toBe("c");
    await userEvent.tab();
    expect(document.activeElement).toBe(el("after"));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(radio("c"));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(el("before"));
  });

  it("is one tab stop in the buttons variant, with the same arrows", async () => {
    const { el, radio, model } = render({ variant: "buttons", value: "b" });
    expect(await tabStops(el)).toEqual(["r-b"]);
    radio("b").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(radio("c"));
    expect(model.value).toBe("c");
  });

  it("is one tab stop inside a CuiFormField", async () => {
    const { el } = render({ inField: true, value: "d" });
    expect(await tabStops(el)).toEqual(["r-d"]);
  });

  it("a readonly group keeps its checked radio as the stop, and arrows select nothing", async () => {
    const { el, radio, model } = render({ readonly: true, value: "b" });
    expect(await tabStops(el)).toEqual(["r-b"]);
    radio("b").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(model.value).toBe("b");
  });

  it("keeps the stop on the focused radio through a re-render in a readonly group", async () => {
    const { wrapper, radio } = render({ readonly: true, value: "b" });
    radio("b").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(radio("c"));
    await wrapper.vm.$forceUpdate();
    await nextTick();
    expect(radio("c").tabIndex).toBe(0);
    expect(radio("b").tabIndex).toBe(-1);
  });

  it("returns the stop to the first radio when the selection is cleared", async () => {
    const { model, radio } = render({ value: "d" });
    expect(radio("d").tabIndex).toBe(0);
    model.value = undefined;
    await nextTick();
    await nextTick();
    expect(["a", "b", "c", "d", "e"].filter((id) => radio(id).tabIndex === 0)).toEqual(["a"]);
  });

  it("a disabled group is skipped entirely", async () => {
    const { el } = render({ groupDisabled: true, value: "b" });
    expect(await tabStops(el)).toEqual([]);
  });

  it("keeps one valid stop when the checked radio is removed, or one is added first", async () => {
    const model = ref<string | undefined>("c");
    const ids = ref(["a", "b", "c"]);
    track(
      mount(
        defineComponent({
          setup: () => () =>
            h(CuiRadioGroup, { modelValue: model.value, label: "G" }, () =>
              ids.value.map((id) => h(CuiRadio, { key: id, id: `d-${id}`, value: id, label: id })),
            ),
        }),
        { attachTo: host({}) },
      ),
    );
    const stops = () =>
      [...document.querySelectorAll<HTMLElement>('[role="radio"]')].filter((e) => e.tabIndex === 0).map((e) => e.id);
    expect(stops()).toEqual(["d-c"]);
    ids.value = ["a", "b"];
    model.value = undefined;
    await nextTick();
    await nextTick();
    expect(stops()).toEqual(["d-a"]);
    ids.value = ["z", "a", "b"];
    await nextTick();
    await nextTick();
    expect(stops()).toHaveLength(1);
  });

  it("a standalone radio keeps its own tab stop", () => {
    track(
      mount(
        defineComponent({
          setup: () => () =>
            h("div", [h(CuiRadio, { id: "s1", value: "x", label: "X" }), h(CuiRadio, { id: "s2", value: "y", label: "Y" })]),
        }),
        { attachTo: host({}) },
      ),
    );
    expect(document.getElementById("s1")!.tabIndex).toBe(0);
    expect(document.getElementById("s2")!.tabIndex).toBe(0);
  });
});
