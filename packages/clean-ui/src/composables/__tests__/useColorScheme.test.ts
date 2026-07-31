import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, nextTick, useTemplateRef } from "vue";
import { mount } from "@vue/test-utils";
import { useColorScheme } from "../useColorScheme";

const Probe = defineComponent({
  setup() {
    const elRef = useTemplateRef<HTMLElement>("root");
    const { isDark } = useColorScheme(elRef);
    return { isDark };
  },
  template: `<div ref="root">{{ isDark }}</div>`,
});

// MutationObserver callbacks are queued as a microtask; nextTick alone isn't
// always enough to drain jsdom's queue in every environment.
function flushMutations() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("useColorScheme", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("resolves false with no dark ancestor", async () => {
    const wrapper = mount(Probe, { attachTo: container });
    await nextTick();
    expect(wrapper.vm.isDark).toBe(false);
    wrapper.unmount();
  });

  it("resolves true when an ancestor has the dark class", async () => {
    container.classList.add("dark");
    const wrapper = mount(Probe, { attachTo: container });
    await nextTick();
    expect(wrapper.vm.isDark).toBe(true);
    wrapper.unmount();
  });

  it("two components in differently-scoped subtrees report different values", async () => {
    const lightScope = document.createElement("div");
    const darkScope = document.createElement("div");
    darkScope.classList.add("dark");
    container.append(lightScope, darkScope);

    const lightWrapper = mount(Probe, { attachTo: lightScope });
    const darkWrapper = mount(Probe, { attachTo: darkScope });
    await nextTick();

    expect(lightWrapper.vm.isDark).toBe(false);
    expect(darkWrapper.vm.isDark).toBe(true);

    lightWrapper.unmount();
    darkWrapper.unmount();
  });

  it("reacts to a class toggled on an ancestor after mount", async () => {
    const wrapper = mount(Probe, { attachTo: container });
    await nextTick();
    expect(wrapper.vm.isDark).toBe(false);

    container.classList.add("dark");
    await flushMutations();
    expect(wrapper.vm.isDark).toBe(true);

    container.classList.remove("dark");
    await flushMutations();
    expect(wrapper.vm.isDark).toBe(false);

    wrapper.unmount();
  });

  it("disconnects its observer on unmount", async () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const wrapper = mount(Probe, { attachTo: container });
    await nextTick();

    wrapper.unmount();

    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });
});
