import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { useCommandPalette } from "@itguy614/clean-ui";
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

  it("offers the site's actions: color mode, debug overlays and every theme", async () => {
    await mountPalette();
    const ids = useCommandPalette().commands.value.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["site.color-mode", "site.debug", "site.theme.default", "site.theme.forest"]));
  });

  it("withdraws its commands when it unmounts", async () => {
    await mountPalette();
    wrapper!.unmount();
    wrapper = undefined;
    expect(useCommandPalette().commands.value.filter((c) => c.id.startsWith("go.") || c.id.startsWith("site."))).toEqual([]);
  });
});
