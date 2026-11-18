import { describe, it, expect, afterEach, vi } from "vitest";
import { createApp, defineComponent, effectScope, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { createCommandPalette, useCommandPalette, useCommandPaletteProvider } from "../useCommandPalette";
import { CuiCommandPaletteKey } from "../command-palette-context";

const palette = useCommandPalette();
const ids = () => palette.commands.value.map((c) => c.id);
const labelOf = (id: string) => palette.commands.value.find((c) => c.id === id)?.label;

const stops: Array<() => void> = [];
function scoped<T>(fn: () => T): T {
  const scope = effectScope();
  stops.push(() => scope.stop());
  return scope.run(fn)!;
}

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  palette.close();
  palette.clearRecents();
});

describe("useCommandPalette (#197)", () => {
  it("registers one command or several, in order", () => {
    scoped(() => {
      palette.register({ id: "a", label: "A" });
      palette.register([{ id: "b", label: "B" }, { id: "c", label: "C" }]);
    });
    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("withdraws on request, once, and only what that registration added", () => {
    const keep = palette.register({ id: "keep", label: "Keep" });
    const drop = palette.register([{ id: "x", label: "X" }, { id: "y", label: "Y" }]);
    drop();
    drop();
    expect(ids()).toEqual(["keep"]);
    keep();
    expect(ids()).toEqual([]);
  });

  it("withdraws a component's commands when it unmounts: a route's commands leave with the route", () => {
    const Route = defineComponent({
      setup() {
        palette.register({ id: "route.only", label: "Only here" });
        return () => h("div");
      },
    });
    const wrapper = mount(Route);
    expect(ids()).toEqual(["route.only"]);
    wrapper.unmount();
    expect(ids()).toEqual([]);
  });

  it("keeps commands registered outside any scope until withdrawn", () => {
    const withdraw = palette.register({ id: "app", label: "App" });
    expect(ids()).toEqual(["app"]);
    withdraw();
    expect(ids()).toEqual([]);
  });

  it("lets the latest registration of an id win, and brings the earlier one back on withdraw", () => {
    const global = palette.register({ id: "same", label: "Global" });
    const route = palette.register({ id: "same", label: "Route" });
    expect(labelOf("same")).toBe("Route");
    expect(ids()).toEqual(["same"]);
    route();
    expect(labelOf("same")).toBe("Global");
    global();
  });

  it("follows a ref or getter, so a command can track state", async () => {
    const label = ref("Before");
    const disabled = ref(false);
    scoped(() => {
      palette.register(() => ({ id: "live", label: label.value, disabled: disabled.value }));
    });
    expect(palette.commands.value[0]).toMatchObject({ label: "Before", disabled: false });
    label.value = "After";
    disabled.value = true;
    await nextTick();
    expect(palette.commands.value[0]).toMatchObject({ label: "After", disabled: true });
  });

  it("opens, closes and toggles the palette", () => {
    palette.open();
    expect(palette.visible.value).toBe(true);
    palette.toggle();
    expect(palette.visible.value).toBe(false);
    palette.toggle();
    palette.close();
    expect(palette.visible.value).toBe(false);
  });
});

describe("scoped registries (#530)", () => {
  // A component that provides its own registry and renders a child that reads it.
  function withProvider(child: () => unknown, registry?: ReturnType<typeof createCommandPalette>) {
    let provided!: ReturnType<typeof useCommandPaletteProvider>;
    const Child = defineComponent({ setup: () => (child(), () => h("i")) });
    const Parent = defineComponent({
      setup() {
        provided = useCommandPaletteProvider(registry);
        return () => h(Child);
      },
    });
    return { wrapper: mount(Parent), provided };
  }

  it("keeps commands, open state and recents apart from the default registry", () => {
    const { provided } = withProvider(() => useCommandPalette().register({ id: "scoped", label: "Scoped" }));
    scoped(() => palette.register({ id: "global", label: "Global" }));
    provided.open();
    expect(provided.commands.value.map((c) => c.id)).toEqual(["scoped"]);
    expect(ids()).toEqual(["global"]);
    expect(provided.visible.value).toBe(true);
    expect(palette.visible.value).toBe(false);
    (provided as unknown as { remember(id: string): void }).remember("scoped");
    expect(provided.recents.value).toEqual(["scoped"]);
    expect(palette.recents.value).toEqual([]);
    palette.clearRecents();
    expect(provided.recents.value).toEqual(["scoped"]);
  });

  it("gives each created registry its own state, and an app's descendants the one it provides", () => {
    const a = createCommandPalette();
    const b = createCommandPalette();
    a.register({ id: "only-a", label: "A" });
    expect(b.commands.value).toEqual([]);
    a.open();
    expect(b.visible.value).toBe(false);

    let seen: unknown;
    const app = createApp({ setup: () => ((seen = useCommandPalette()), () => h("div")) });
    app.provide(CuiCommandPaletteKey, a);
    app.mount(document.createElement("div"));
    expect(seen).toBe(a);
    app.unmount();
  });

  it("withdraws a scoped registration on unmount, from the scoped registry only", () => {
    const registry = createCommandPalette();
    scoped(() => palette.register({ id: "global", label: "Global" }));
    const { wrapper } = withProvider(() => useCommandPalette().register({ id: "route", label: "Route" }), registry);
    expect(registry.commands.value.map((c) => c.id)).toEqual(["route"]);
    wrapper.unmount();
    expect(registry.commands.value).toEqual([]);
    expect(ids()).toEqual(["global"]);
  });

  it("resolves the latest registration of an id within a registry, and withdraw restores the earlier one", () => {
    const registry = createCommandPalette();
    registry.register({ id: "x", label: "First" });
    const second = registry.register({ id: "x", label: "Second" });
    scoped(() => palette.register({ id: "x", label: "Default" }));
    expect(registry.commands.value.map((c) => c.label)).toEqual(["Second"]);
    second();
    expect(registry.commands.value.map((c) => c.label)).toEqual(["First"]);
    expect(labelOf("x")).toBe("Default");
  });

  it("answers with the default registry outside a component, with no warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(useCommandPalette()).toBe(palette);
    // A component with no provider above it too.
    let seen: unknown;
    mount(defineComponent({ setup: () => ((seen = useCommandPalette()), () => h("i")) }));
    expect(seen).toBe(palette);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("scoped registries (#530)", () => {
  // A component that provides its own registry and renders a child that reads it.
  function withProvider(child: () => unknown, registry?: ReturnType<typeof createCommandPalette>) {
    let provided!: ReturnType<typeof useCommandPaletteProvider>;
    const Child = defineComponent({ setup: () => (child(), () => h("i")) });
    const Parent = defineComponent({
      setup() {
        provided = useCommandPaletteProvider(registry);
        return () => h(Child);
      },
    });
    return { wrapper: mount(Parent), provided };
  }

  it("keeps commands, open state and recents apart from the default registry", () => {
    const { provided } = withProvider(() => useCommandPalette().register({ id: "scoped", label: "Scoped" }));
    scoped(() => palette.register({ id: "global", label: "Global" }));
    provided.open();
    expect(provided.commands.value.map((c) => c.id)).toEqual(["scoped"]);
    expect(ids()).toEqual(["global"]);
    expect(provided.visible.value).toBe(true);
    expect(palette.visible.value).toBe(false);
    (provided as unknown as { remember(id: string): void }).remember("scoped");
    expect(provided.recents.value).toEqual(["scoped"]);
    expect(palette.recents.value).toEqual([]);
    palette.clearRecents();
    expect(provided.recents.value).toEqual(["scoped"]);
  });

  it("gives each created registry its own state, and an app's descendants the one it provides", () => {
    const a = createCommandPalette();
    const b = createCommandPalette();
    a.register({ id: "only-a", label: "A" });
    expect(b.commands.value).toEqual([]);
    a.open();
    expect(b.visible.value).toBe(false);

    let seen: unknown;
    const app = createApp({ setup: () => ((seen = useCommandPalette()), () => h("div")) });
    app.provide(CuiCommandPaletteKey, a);
    app.mount(document.createElement("div"));
    expect(seen).toBe(a);
    app.unmount();
  });

  it("withdraws a scoped registration on unmount, from the scoped registry only", () => {
    const registry = createCommandPalette();
    scoped(() => palette.register({ id: "global", label: "Global" }));
    const { wrapper } = withProvider(() => useCommandPalette().register({ id: "route", label: "Route" }), registry);
    expect(registry.commands.value.map((c) => c.id)).toEqual(["route"]);
    wrapper.unmount();
    expect(registry.commands.value).toEqual([]);
    expect(ids()).toEqual(["global"]);
  });

  it("resolves the latest registration of an id within a registry, and withdraw restores the earlier one", () => {
    const registry = createCommandPalette();
    registry.register({ id: "x", label: "First" });
    const second = registry.register({ id: "x", label: "Second" });
    scoped(() => palette.register({ id: "x", label: "Default" }));
    expect(registry.commands.value.map((c) => c.label)).toEqual(["Second"]);
    second();
    expect(registry.commands.value.map((c) => c.label)).toEqual(["First"]);
    expect(labelOf("x")).toBe("Default");
  });

  it("answers with the default registry outside a component, with no warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(useCommandPalette()).toBe(palette);
    // A component with no provider above it too.
    let seen: unknown;
    mount(defineComponent({ setup: () => ((seen = useCommandPalette()), () => h("i")) }));
    expect(seen).toBe(palette);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
