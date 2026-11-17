import { describe, it, expect, afterEach } from "vitest";
import { defineComponent, effectScope, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { useCommandPalette } from "../useCommandPalette";

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
