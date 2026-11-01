import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createApp, defineComponent, h, nextTick, ref, type Component, type Plugin } from "vue";
import { createCleanUI, CuiConfigProvider, CuiModalHeader, useCleanUIContext, type CleanUIContext } from "../../index";

// #326: an app mounted outside the host's tree (the editor's link dialog) cannot inject the
// host's defaults or catalog. useCleanUIContext() captures them; provideTo() hands them on.
const Header = defineComponent(() => () => h(CuiModalHeader, { title: "Title" }));

describe("useCleanUIContext", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    cleanups.splice(0).forEach((c) => c());
    document.body.innerHTML = "";
  });

  /** Mount `wrap(probe)` as the host, and return what the probe captured inside it. */
  function capture(wrap: (probe: Component) => Component, plugins: Plugin[] = []) {
    let captured!: CleanUIContext;
    const Probe = defineComponent(() => {
      captured = useCleanUIContext();
      return () => null;
    });
    const host = mount(wrap(Probe), { global: { plugins } });
    cleanups.push(() => host.unmount());
    return captured;
  }

  function mountDetached(context: CleanUIContext): HTMLElement {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const app = createApp(Header);
    context.provideTo(app);
    app.mount(el);
    cleanups.push(() => app.unmount());
    return el;
  }

  it("hands the app's defaults and a provider's messages to a detached app", () => {
    const context = capture(
      (Probe) =>
        defineComponent(() => () => h(CuiConfigProvider, { messages: { close: "Fermer" } }, () => h(Probe))),
      [createCleanUI({ headingLevels: { modalHeader: "h3" } })],
    );
    const el = mountDetached(context);
    expect(el.querySelector("h3")?.textContent).toBe("Title");
    expect(el.querySelector("button")?.getAttribute("aria-label")).toBe("Fermer");
  });

  it("stays live: a change to the host's provider reaches the detached app", async () => {
    const level = ref<"h3" | "h4">("h3");
    const context = capture((Probe) =>
      defineComponent(() => () => h(CuiConfigProvider, { headingLevels: { modalHeader: level.value } }, () => h(Probe))),
    );
    const el = mountDetached(context);
    expect(el.querySelector("h3")).not.toBeNull();
    level.value = "h4";
    await nextTick();
    expect(el.querySelector("h4")).not.toBeNull();
  });

  it("provides nothing when nothing is provided above, so the library's defaults apply", () => {
    const context = capture((Probe) => Probe);
    const el = mountDetached(context);
    expect(el.querySelector("h2")?.textContent).toBe("Title");
    expect(el.querySelector("button")?.getAttribute("aria-label")).toBe("Close");
  });
});
