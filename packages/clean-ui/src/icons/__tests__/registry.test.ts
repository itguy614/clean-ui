import { describe, it, expect, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import CuiIcon from "../../components/CuiIcon.vue";
import {
  registerIcons,
  hasIcon,
  registeredIconNames,
  __clearRegisteredIcons,
  setIconFallbackResolver,
  getIconFallbackResolver,
} from "../registry";

/** Stand-in for a Phosphor icon component. */
const FakeIcon = defineComponent({
  name: "FakeIcon",
  props: { weight: String, size: String, color: String },
  setup: () => () => h("svg", { "data-fake": "true" }),
});

afterEach(() => {
  __clearRegisteredIcons();
  vi.restoreAllMocks();
});

describe("registerIcons", () => {
  it("makes a name resolvable without the lazy import", () => {
    expect(hasIcon("rocket")).toBe(false);
    registerIcons({ rocket: FakeIcon });
    expect(hasIcon("rocket")).toBe(true);
  });

  it("lists registered names alongside the built-ins", () => {
    registerIcons({ rocket: FakeIcon });
    const names = registeredIconNames();
    expect(names).toContain("rocket");
    expect(names).toContain("check"); // built-in
  });

  it("lets a registration override a built-in of the same name", () => {
    const wrapper = mount(CuiIcon, { props: { name: "check" } });
    expect(wrapper.find("[data-fake]").exists()).toBe(false);

    registerIcons({ check: FakeIcon });
    const after = mount(CuiIcon, { props: { name: "check" } });
    expect(after.find("[data-fake]").exists()).toBe(true);
  });

  it("re-resolves an already-rendered icon when its name is registered later", async () => {
    const wrapper = mount(CuiIcon, { props: { name: "rocket" } });
    // unresolved at first: placeholder, no svg from the registry
    expect(wrapper.find("[data-fake]").exists()).toBe(false);

    registerIcons({ rocket: FakeIcon });
    await nextTick();

    expect(wrapper.find("[data-fake]").exists()).toBe(true);
  });
});

describe("CuiIcon resolution", () => {
  it("renders a built-in name synchronously — no await needed", () => {
    // The point of the static map: an icon is present on first render, which is
    // also what lets it render during SSR.
    const wrapper = mount(CuiIcon, { props: { name: "check" } });
    expect(wrapper.find("svg").exists()).toBe(true);
    expect(wrapper.find(".cui-icon__placeholder").exists()).toBe(false);
  });

  it("renders a component passed via the icon prop, taking precedence over name", () => {
    const wrapper = mount(CuiIcon, { props: { name: "check", icon: FakeIcon } });
    expect(wrapper.find("[data-fake]").exists()).toBe(true);
  });

  it("renders the fallback glyph for an unknown name when no resolver is installed", () => {
    const wrapper = mount(CuiIcon, { props: { name: "definitely-not-an-icon" } });
    // "?" rather than a blank box, so a typo is visible
    expect(wrapper.find("svg").exists()).toBe(true);
    expect(wrapper.find(".cui-icon__placeholder").exists()).toBe(false);
  });

  it("warns for an unknown name, naming both remedies", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // A name no other test has mounted: the warning is once-per-message, so a
    // reused name would already have been emitted and deduped.
    mount(CuiIcon, { props: { name: "paper-plane-tilt" } });
    await flushPromises();

    const message = warn.mock.calls.flat().join("\n");
    expect(message).toContain('registerIcons({ "paper-plane-tilt": PhPaperPlaneTilt })');
    expect(message).toContain("@itguy614/clean-ui/icons/lazy");
  });

  it("does not warn for a built-in name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(CuiIcon, { props: { name: "check" } });
    await flushPromises();

    expect(warn.mock.calls.flat().join("\n")).not.toContain("unknown icon");
  });

  it("switches synchronously when the name prop changes between built-ins", async () => {
    const wrapper = mount(CuiIcon, { props: { name: "check" } });
    const first = wrapper.find("svg").html();

    await wrapper.setProps({ name: "x" });
    expect(wrapper.find("svg").html()).not.toBe(first);
  });
});

describe("opt-in fallback resolver", () => {
  it("resolves an unregistered name once a resolver is installed", async () => {
    setIconFallbackResolver(async (name) => (name === "rocket" ? FakeIcon : undefined));
    const wrapper = mount(CuiIcon, { props: { name: "rocket" } });

    // async: the placeholder holds the space until the resolver settles
    expect(wrapper.find(".cui-icon__placeholder").exists()).toBe(true);
    await flushPromises();
    expect(wrapper.find("[data-fake]").exists()).toBe(true);

    setIconFallbackResolver(null);
  });

  it("falls back to the glyph when the resolver yields nothing", async () => {
    setIconFallbackResolver(async () => undefined);
    const wrapper = mount(CuiIcon, { props: { name: "nope-not-real" } });
    await flushPromises();

    expect(wrapper.find("svg").exists()).toBe(true);
    setIconFallbackResolver(null);
  });

  it("survives a resolver that rejects", async () => {
    setIconFallbackResolver(async () => {
      throw new Error("network down");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const wrapper = mount(CuiIcon, { props: { name: "offline-icon" } });
    await flushPromises();

    expect(wrapper.find("svg").exists()).toBe(true);
    expect(warn.mock.calls.flat().join("\n")).toContain('Failed to load icon "offline-icon"');
    setIconFallbackResolver(null);
  });

  it("prefers a registered icon over the resolver", async () => {
    const resolver = vi.fn(async () => FakeIcon);
    setIconFallbackResolver(resolver);
    mount(CuiIcon, { props: { name: "check" } }); // built-in
    await flushPromises();

    expect(resolver).not.toHaveBeenCalled();
    setIconFallbackResolver(null);
  });

  it("icons/lazy installs a resolver on import", async () => {
    const { enableLazyIcons, disableLazyIcons } = await import("../lazy");
    disableLazyIcons();
    expect(getIconFallbackResolver()).toBeNull();

    enableLazyIcons();
    expect(getIconFallbackResolver()).toBeTypeOf("function");
    disableLazyIcons();
  });
});
