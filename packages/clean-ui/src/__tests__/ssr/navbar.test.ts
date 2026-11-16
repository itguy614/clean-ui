import { describe, it, expect } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import CuiNavbar from "../../components/CuiNavbar.vue";
import CuiNavbarBrand from "../../components/CuiNavbarBrand.vue";
import CuiNavbarNav from "../../components/CuiNavbarNav.vue";
import CuiNavbarActions from "../../components/CuiNavbarActions.vue";
import CuiNavbarMenu from "../../components/CuiNavbarMenu.vue";

/**
 * The server has no viewport, so it can't know whether the navbar is collapsed: it always
 * renders the bar, and so does the client's first render (the drawer decision waits for
 * mount). Rendering twice must be byte-identical, ids included, or hydration mismatches. A
 * sticky bar touches the document only after mount, never while rendering.
 */
const app = (props: Record<string, unknown> = {}) =>
  createSSRApp({
    render: () =>
      h(CuiNavbar, props, () => [
        h(CuiNavbarBrand, { href: "/" }, () => "Clean UI"),
        h(CuiNavbarNav, null, () => [
          h("a", { href: "/docs", "aria-current": "page" }, "Docs"),
          h(CuiNavbarMenu, { label: "Components" }, () => h("a", { href: "/button" }, "Button")),
        ]),
        h(CuiNavbarActions, null, () => h("button", null, "Theme")),
      ]),
  });

describe("CuiNavbar renders on the server (node environment)", () => {
  it("renders the header with its named nav, brand, menu trigger and actions", async () => {
    const html = await renderToString(app());
    expect(html).toContain("<header");
    expect(html).toContain('<nav class="cui-navbar-nav"');
    expect(html).toContain('aria-label="Main"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Clean UI");
    expect(html).toContain("Components");
    expect(html).toContain('aria-haspopup="menu"');
    // The menu is shut and the viewport unknown: no panel, no drawer, no menu button.
    expect(html).not.toContain('role="menu"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("Navigation menu");
    expect(html).not.toContain("Button");
  });

  it("renders identical markup on every render, sticky and collapsing included", async () => {
    const first = await renderToString(app({ sticky: true, collapseBelow: "xl" }));
    const second = await renderToString(app({ sticky: true, collapseBelow: "xl" }));
    expect(first).toContain("cui-navbar--sticky");
    expect(second).toBe(first);
  });
});
