import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import { frames, installTokens, injectStyle } from "../../../../../config/test/browser-helpers";

/**
 * #489 — the two override routes CuiTimePicker now promises, as CuiButton does (#114): a plain
 * consumer rule, and a `--cui-time-picker-*` token set on a container. Real browser, because
 * both are claims about the cascade. A bare inline declaration (a style binding) outranks the
 * plain rule; an inline PUBLIC token outranks the container's.
 */
describe("CuiTimePicker's themeable properties (real browser)", () => {
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(main)));
  afterAll(() => teardown());

  let wrapper: VueWrapper | undefined;
  let host: HTMLElement | undefined;
  let extra: (() => void) | undefined;
  afterEach(() => {
    wrapper?.unmount();
    host?.remove();
    extra?.();
    wrapper = host = extra = undefined;
    for (const p of ["height", "px", "font-size", "bg", "border", "radius", "color", "pressed-bg", "pressed-color"]) {
      document.body.style.removeProperty(`--cui-time-picker-${p}`);
    }
  });

  async function open(props: Record<string, unknown>, hostStyle = "") {
    host = document.createElement("div");
    host.setAttribute("style", hostStyle);
    document.body.append(host);
    wrapper = mount(CuiTimePicker, { props: { modelValue: "09:15 AM", ...props }, attachTo: host });
    (host.querySelector(".cui-time-picker__trigger") as HTMLElement).focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);
    return host;
  }

  const paint = (el: Element | null, prop: string) => getComputedStyle(el!).getPropertyValue(prop);
  const q = (sel: string) => document.querySelector(sel);

  it("lets a plain consumer rule win on the trigger, the label and the panel, with no !important", async () => {
    extra = injectStyle(`.cui-time-picker__trigger { background: rgb(1, 2, 3); border-color: rgb(4, 5, 6); border-radius: 3px; height: 50px; padding: 0 9px; font-size: 20px; color: rgb(7, 8, 9); }
      .cui-time-picker__label { color: rgb(10, 11, 12); font-size: 22px; }
      .cui-time-picker__separator { color: rgb(13, 14, 15); }
      .cui-time-picker__panel { padding: 17px; column-gap: 11px; }
      .cui-time-picker__icon { color: rgb(16, 17, 18); }`);
    await open({ label: "Start" });
    const trigger = q(".cui-time-picker__trigger");
    expect(paint(trigger, "background-color")).toBe("rgb(1, 2, 3)");
    expect(paint(trigger, "border-top-color")).toBe("rgb(4, 5, 6)");
    expect(paint(trigger, "border-top-left-radius")).toBe("3px");
    expect(paint(trigger, "height")).toBe("50px");
    expect(paint(trigger, "padding-left")).toBe("9px");
    expect(paint(trigger, "font-size")).toBe("20px");
    expect(paint(trigger, "color")).toBe("rgb(7, 8, 9)");
    expect(paint(q(".cui-time-picker__label"), "color")).toBe("rgb(10, 11, 12)");
    expect(paint(q(".cui-time-picker__label"), "font-size")).toBe("22px");
    expect(paint(q(".cui-time-picker__icon"), "color")).toBe("rgb(16, 17, 18)");
    expect(paint(q(".cui-time-picker__separator"), "color")).toBe("rgb(13, 14, 15)");
    expect(paint(q(".cui-time-picker__panel"), "padding-top")).toBe("17px");
    expect(paint(q(".cui-time-picker__panel"), "column-gap")).toBe("11px");
  });

  it("lets a plain rule win on the AM and PM buttons, which restyle CuiButton", async () => {
    extra = injectStyle(`.cui-time-picker__period--on { background: rgb(1, 2, 3); color: rgb(4, 5, 6); }
      .cui-time-picker__period { border-radius: 2px; }`);
    await open({});
    const am = document.querySelectorAll(".cui-time-picker__period")[0];
    expect(paint(am, "background-color")).toBe("rgb(1, 2, 3)");
    expect(paint(am, "color")).toBe("rgb(4, 5, 6)");
    expect(paint(am, "border-top-left-radius")).toBe("2px");
  });

  it("lets a token set on a container win on the trigger", async () => {
    const h = await open({}, "--cui-time-picker-height: 52px; --cui-time-picker-px: 21px; --cui-time-picker-bg: rgb(1, 2, 3); --cui-time-picker-border: rgb(4, 5, 6); --cui-time-picker-radius: 7px; --cui-time-picker-font-size: 19px; --cui-time-picker-color: rgb(8, 9, 10);");
    const trigger = h.querySelector(".cui-time-picker__trigger");
    expect(paint(trigger, "height")).toBe("52px");
    expect(paint(trigger, "padding-left")).toBe("21px");
    expect(paint(trigger, "background-color")).toBe("rgb(1, 2, 3)");
    expect(paint(trigger, "border-top-color")).toBe("rgb(4, 5, 6)");
    expect(paint(trigger, "border-top-left-radius")).toBe("7px");
    expect(paint(trigger, "font-size")).toBe("19px");
    expect(paint(trigger, "color")).toBe("rgb(8, 9, 10)");
  });

  it("lets a token on <body> win on the selected AM or PM", async () => {
    // The panel is teleported to <body>, outside the host, so the token goes on <body>.
    document.body.style.setProperty("--cui-time-picker-pressed-bg", "rgb(10, 20, 30)");
    document.body.style.setProperty("--cui-time-picker-pressed-color", "rgb(40, 50, 60)");
    await open({});
    const am = document.querySelectorAll(".cui-time-picker__period")[0];
    expect(paint(am, "background-color")).toBe("rgb(10, 20, 30)");
    expect(paint(am, "color")).toBe("rgb(40, 50, 60)");
    // The unselected one is untouched.
    expect(paint(document.querySelectorAll(".cui-time-picker__period")[1], "background-color")).toBe("rgba(0, 0, 0, 0)");
  });
});
