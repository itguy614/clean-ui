import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref, type Ref } from "vue";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { useClickOutside } from "../useClickOutside";

enableAutoUnmount(afterEach);
afterEach(() => vi.restoreAllMocks());

const press = (el: Element) => el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

describe("useClickOutside", () => {
  function setup(enabled?: Ref<boolean>) {
    const onOutside = vi.fn();
    const inside = ref<HTMLElement | null>(null);
    mount(
      defineComponent(() => {
        useClickOutside([inside], onOutside, { enabled });
        return () => h("div", [h("button", { ref: inside, id: "inside" }), h("button", { id: "outside" })]);
      }),
      { attachTo: document.body },
    );
    return onOutside;
  }

  it("calls the handler for a press outside the targets only", () => {
    const onOutside = setup();
    press(document.getElementById("inside")!);
    expect(onOutside).not.toHaveBeenCalled();
    press(document.getElementById("outside")!);
    expect(onOutside).toHaveBeenCalledOnce();
  });

  it("listens only while enabled", async () => {
    const enabled = ref(false);
    const onOutside = setup(enabled);
    press(document.getElementById("outside")!);
    expect(onOutside).not.toHaveBeenCalled();
    enabled.value = true;
    await nextTick();
    await new Promise((r) => setTimeout(r)); // armed a task later
    press(document.getElementById("outside")!);
    expect(onOutside).toHaveBeenCalledOnce();
  });

  it("adds nothing when called outside a component scope", () => {
    const add = vi.spyOn(document, "addEventListener");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    useClickOutside([], () => {});
    expect(add.mock.calls.filter(([t]) => t === "mousedown")).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});

// #203: five components hand-rolled the same document mousedown pair, and two of them
// leaked window listeners (#202). useClickOutside and useEventListener are the routes;
// this keeps it that way for every window or document listener a component adds.
describe("global listeners", () => {
  // Reasons, per preflight.test.ts. A stale exemption fails too.
  const EXEMPT: Record<string, string> = {
    "CuiColorPicker.vue": "one closure per drag, filtered by pointerId; moves to usePointerDrag in #275",
  };

  it("no component adds its own window or document listener", () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../../components");
    const offenders = readdirSync(dir).filter(
      (f) => f.endsWith(".vue") && /\b(window|document)\.addEventListener\(/.test(readFileSync(join(dir, f), "utf8")),
    );
    expect(offenders.filter((f) => !(f in EXEMPT))).toEqual([]);
    expect(Object.keys(EXEMPT).filter((f) => !offenders.includes(f))).toEqual([]);
  });
});
