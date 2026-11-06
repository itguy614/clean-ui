import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h, nextTick, ref } from "vue";
import CuiTabs from "../../components/CuiTabs.vue";
import CuiTab from "../../components/CuiTab.vue";
import preflight from "../../styles/preflight.css?inline";
import { installTokens, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #153 — the close control was a <button> inside the tab <button>. HTML forbids it, and the
 * parser unnests it, so the DOM a browser built differed from the template (and a real key
 * press had no route to close a tab at all). Real events, and the real HTML parser.
 */
describe("CuiTabs close button (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  let teardown: () => void;
  beforeAll(() => (teardown = installTokens(preflight)));
  afterAll(() => teardown());
  afterEach(cleanup);

  function mountTabs() {
    const values = ref(["a", "b", "c"]);
    const active = ref("a");
    const closed: string[] = [];
    const wrapper = track(
      mount(
        defineComponent({
          setup: () => () =>
            h(
              CuiTabs,
              {
                modelValue: active.value,
                "onUpdate:modelValue": (v: string) => (active.value = v),
                onClose: (v: string) => {
                  closed.push(v);
                  values.value = values.value.filter((x) => x !== v);
                },
              },
              () => values.value.map((v) => h(CuiTab, { key: v, value: v, label: `Tab ${v}`, closeable: true }, () => v)),
            ),
        }),
        { attachTo: host({ width: "400px" }) },
      ),
    );
    const bar = wrapper.element.querySelector<HTMLElement>('[role="tablist"]')!;
    return { bar, closed };
  }

  it("serialises to markup that parses back to the same structure, with no nested button", async () => {
    const { bar } = mountTabs();
    await nextTick();
    const parsed = document.createElement("div");
    parsed.innerHTML = bar.outerHTML;
    const reparsed = parsed.firstElementChild as HTMLElement;
    expect(bar.querySelectorAll("button button")).toHaveLength(0);
    // The parser unnests a button in a button: the structure survives only when it was valid.
    expect(reparsed.querySelectorAll("button")).toHaveLength(bar.querySelectorAll("button").length);
    expect(reparsed.querySelectorAll('[role="tab"] button')).toHaveLength(0);
    expect(reparsed.innerHTML).toBe(bar.innerHTML);
  });

  it("Delete from a real key press closes the focused tab and focuses its neighbour", async () => {
    const { bar, closed } = mountTabs();
    await nextTick();
    const tab = (v: string) => bar.querySelector<HTMLElement>(`[data-cui-tab-value="${v}"]`)!;
    tab("a").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("b"));
    await userEvent.keyboard("{Delete}");
    await nextTick();
    expect(closed).toEqual(["b"]);
    expect(document.activeElement).toBe(tab("c"));
    await userEvent.keyboard("{Backspace}");
    await nextTick();
    expect(closed).toEqual(["b", "c"]);
    expect(document.activeElement).toBe(tab("a"));
  });

  it("keeps the close button out of the tab sequence but clickable", async () => {
    const { bar, closed } = mountTabs();
    await nextTick();
    bar.querySelector<HTMLElement>('[role="tab"]')!.focus();
    await userEvent.tab();
    // The one tab stop is the active tab; Tab leaves the bar rather than visiting a close button.
    expect(bar.contains(document.activeElement)).toBe(false);
    await userEvent.click(bar.querySelectorAll<HTMLElement>(".cui-tabs__tab-close")[2]);
    expect(closed).toEqual(["c"]);
  });
});
