import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h, nextTick } from "vue";
import { CuiCommandPalette, useCommandPalette, useCommandPaletteProvider, type UseCommandPalette } from "@itguy614/clean-ui";
import SitePalette from "../SitePalette.vue";
import { PAGES } from "../../navigation/pages";

const Blank = { render: () => null };

let wrapper: VueWrapper | undefined;
afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
});

async function mountPalette() {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: Blank }] });
  await router.push("/");
  wrapper = mount(SitePalette, { attachTo: document.body, global: { plugins: [router] } });
  return router;
}

describe("the site palette", () => {
  it("registers every documentation page, with its keywords, in its nav group", async () => {
    await mountPalette();
    const commands = useCommandPalette().commands.value;
    for (const page of PAGES) {
      const command = commands.find((c) => c.id === `go.${page.id}`);
      expect(command, page.id).toBeDefined();
      expect(command).toMatchObject({ label: page.label, group: page.group, keywords: page.keywords });
    }
  });

  it("navigates with the router when a page command runs", async () => {
    const router = await mountPalette();
    const target = PAGES.find((p) => p.path !== "/")!;
    useCommandPalette().commands.value.find((c) => c.id === `go.${target.id}`)!.action!({ id: "", label: "" });
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(target.path);
  });

  it("offers the site's actions: color mode and every theme", async () => {
    await mountPalette();
    const ids = useCommandPalette().commands.value.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["site.color-mode", "site.theme.default", "site.theme.forest"]));
  });

  it("keeps Mod-K beside a page palette that has a registry and a shortcut of its own", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: Blank }] });
    await router.push("/");
    let scoped!: UseCommandPalette;
    const Page = defineComponent({
      setup() {
        scoped = useCommandPaletteProvider();
        return () => h(CuiCommandPalette, { hotkey: "mod+e", label: "Demo" });
      },
    });
    wrapper = mount({ render: () => [h(SitePalette), h(Page)] }, { attachTo: document.body, global: { plugins: [router] } });
    const press = async (key: string) => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true, cancelable: true }));
      await nextTick();
    };
    const site = useCommandPalette();
    await press("k");
    expect([site.visible.value, scoped.visible.value]).toEqual([true, false]);
    await press("k");
    await press("e");
    expect([site.visible.value, scoped.visible.value]).toEqual([false, true]);
  });

  it("withdraws its commands when it unmounts", async () => {
    await mountPalette();
    wrapper!.unmount();
    wrapper = undefined;
    expect(useCommandPalette().commands.value.filter((c) => c.id.startsWith("go.") || c.id.startsWith("site."))).toEqual([]);
  });
});
