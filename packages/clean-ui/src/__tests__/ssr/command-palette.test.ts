import { describe, it, expect } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import { createCommandPalette, useCommandPalette, useCommandPaletteProvider } from "../../composables/useCommandPalette";
import { CuiCommandPaletteKey } from "../../composables/command-palette-context";

// #530: a registry that outlives a request would hand its commands to the next one, so on
// the server `register` does nothing, in the default registry and in a scoped one.
describe("command registries on the server (node environment)", () => {
  it("leaves no commands behind in the default or a provided registry", async () => {
    expect(typeof window).toBe("undefined");
    const provided: Array<ReturnType<typeof useCommandPalette>> = [];
    const Child = defineComponent({
      setup() {
        useCommandPalette().register({ id: "child", label: "Child" });
        return () => h("p", "child");
      },
    });
    const Page = defineComponent({
      setup() {
        useCommandPalette().register({ id: "page", label: "Page" });
        provided.push(useCommandPaletteProvider());
        return () => h(Child);
      },
    });
    const html = await renderToString(createSSRApp(Page));
    expect(html).toContain("child");
    expect(useCommandPalette().commands.value).toEqual([]);
    expect(provided[0].commands.value).toEqual([]);
  });

  it("an app-provided registry stays empty across requests", async () => {
    const shared = createCommandPalette();
    for (let i = 0; i < 2; i++) {
      const app = createSSRApp({ setup: () => (shared.register({ id: `r${i}`, label: "R" }), () => h("div")) });
      app.provide(CuiCommandPaletteKey, shared);
      await renderToString(app);
    }
    expect(shared.commands.value).toEqual([]);
  });
});
