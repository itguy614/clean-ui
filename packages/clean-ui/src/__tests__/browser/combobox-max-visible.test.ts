import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import CuiCombobox from "../../components/CuiCombobox.vue";
import { frames, mountHosts } from "./helpers";

// #212: maxVisible was declared, documented and read by nothing; the panel's height came
// from a fixed 320px cap. Real browser: it is measured from the rendered rows.
describe("CuiCombobox maxVisible (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  const options = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `Option ${i + 1}` }));
  const visibleRows = () => {
    const panel = document.querySelector<HTMLElement>(".cui-combobox__dropdown")!.getBoundingClientRect();
    return [...document.querySelectorAll<HTMLElement>('.cui-combobox__dropdown [role="option"]')].filter((row) => {
      const r = row.getBoundingClientRect();
      return r.top >= panel.top - 1 && r.bottom <= panel.bottom + 1;
    }).length;
  };

  it.each([3, 5])("shows exactly %i options before scrolling", async (maxVisible) => {
    const el = host({ position: "fixed", left: "20px", top: "20px", width: "240px" });
    track(mount(CuiCombobox, { attachTo: el, props: { options, maxVisible } }));
    await userEvent.click(el.querySelector("input")!);
    await frames(4);
    expect(visibleRows()).toBe(maxVisible);
    const panel = document.querySelector<HTMLElement>(".cui-combobox__dropdown")!;
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight); // the rest scrolls
  });
});
