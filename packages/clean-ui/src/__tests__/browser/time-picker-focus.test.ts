import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiTimePicker from "../../components/CuiTimePicker.vue";
import preflight from "../../styles/preflight.css?inline";

/**
 * #74 — opening the time picker has to put focus inside the panel.
 *
 * The panel is teleported to <body>, so it is nowhere near the trigger in tab
 * order: leaving focus on the trigger meant Tab went off to whatever follows
 * the component in the document, never into the hours field. Combined with
 * CuiInputStepper having had no keydown handling at all, the panel opened and
 * then did nothing at all for a keyboard user.
 *
 * Real browser, because CuiPopover holds the panel `visibility: hidden` until
 * Floating UI positions it (#88) and focus() on a hidden element is a silent
 * no-op — jsdom has no such rule and passes either way.
 */
describe("CuiTimePicker focus hand-off (real browser)", () => {
  let wrapper: VueWrapper | undefined;

  beforeAll(() => {
    const style = document.createElement("style");
    style.textContent = `@layer theme, base, components, utilities;\n@layer base { ${preflight} }`;
    document.head.append(style);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  const frames = async (n: number) => {
    for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
  };

  function mountPicker(props: Record<string, unknown> = {}) {
    wrapper = mount(CuiTimePicker, {
      attachTo: document.body,
      props: { modelValue: "09:30", format: "24", ...props },
    });
    return wrapper;
  }

  const trigger = () => wrapper!.find(".cui-time-picker__trigger").element as HTMLElement;
  const panel = () => document.querySelector<HTMLElement>(".cui-time-picker__panel");

  async function open() {
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);
  }

  it("moves focus into the panel when it opens", async () => {
    mountPicker();
    await open();

    expect(panel()).toBeTruthy();
    const active = document.activeElement as HTMLElement;
    expect(active, "focus must leave the trigger").not.toBe(trigger());
    expect(panel()!.contains(active), "focus must be inside the panel").toBe(true);
    expect(active.getAttribute("role")).toBe("spinbutton");
  });

  it("the arrow keys then change the value", async () => {
    mountPicker();
    await open();

    await userEvent.keyboard("{ArrowUp}");
    await frames(4);
    const emitted = wrapper!.emitted("update:modelValue")!;
    expect(String(emitted[emitted.length - 1][0])).toBe("10:30");

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await frames(4);
    const after = wrapper!.emitted("update:modelValue")!;
    expect(String(after[after.length - 1][0])).toBe("08:30");
  });

  it("Escape from inside the panel closes it and returns focus to the trigger", async () => {
    mountPicker();
    await open();
    expect(document.activeElement).not.toBe(trigger());

    await userEvent.keyboard("{Escape}");
    await frames(8);

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

it("Right and Left move between hour, minute and AM/PM", async () => {
    wrapper?.unmount();
    wrapper = mount(CuiTimePicker, {
      attachTo: document.body,
      props: { modelValue: "09:30 AM", format: "12" },
    });
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(12);

    const label = () => {
      const el = document.activeElement as HTMLElement;
      return el.getAttribute("role") === "spinbutton"
        ? `spin:${el.getAttribute("aria-valuemax")}`
        : el.className.includes("cui-time-picker__period")
          ? "period"
          : "other";
    };

    expect(label()).toBe("spin:12");     // hours
    await userEvent.keyboard("{ArrowRight}");
    await frames(4);
    expect(label()).toBe("spin:59");     // minutes
    await userEvent.keyboard("{ArrowRight}");
    await frames(4);
    expect(label()).toBe("period");      // AM/PM
    await userEvent.keyboard("{ArrowLeft}");
    await frames(4);
    expect(label()).toBe("spin:59");     // back to minutes
  });

  it("stops at the ends rather than wrapping round", async () => {
    mountPicker();
    await open();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await frames(4);

    // Still on hours — jumping to the far end mid-entry is disorienting.
    expect((document.activeElement as HTMLElement).getAttribute("aria-valuemax")).toBe("23");
  });

  it("Tab goes straight between the fields, not through the spinner buttons", async () => {
    mountPicker();
    await open();
    const first = document.activeElement as HTMLElement;

    await userEvent.tab();
    await frames(4);
    const second = document.activeElement as HTMLElement;

    expect(second).not.toBe(first);
    expect(second.getAttribute("role"), "next tab stop should be the minutes field").toBe("spinbutton");
  });

  it("the focused field is genuinely visible, not a hidden one", async () => {
    mountPicker();
    await open();

    const active = document.activeElement as HTMLElement;
    expect(getComputedStyle(active).visibility).toBe("visible");
    expect(active.getBoundingClientRect().width).toBeGreaterThan(0);
  });
});
