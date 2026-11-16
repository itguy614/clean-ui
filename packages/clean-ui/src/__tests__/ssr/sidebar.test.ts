import { describe, it, expect } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import CuiSidebar from "../../components/CuiSidebar.vue";
import CuiSidebarHeader from "../../components/CuiSidebarHeader.vue";
import CuiSidebarContent from "../../components/CuiSidebarContent.vue";
import CuiSidebarFooter from "../../components/CuiSidebarFooter.vue";
import CuiSidebarGroup from "../../components/CuiSidebarGroup.vue";

/**
 * The server has no viewport, so it can't know whether the sidebar is collapsed: it always
 * renders the inline column, and so does the client's first render (the drawer decision waits
 * for mount). Rendering twice must be byte-identical — ids included — or hydration mismatches.
 */
const app = (props: Record<string, unknown> = {}) =>
  createSSRApp({
    render: () =>
      h(CuiSidebar, props, () => [
        h(CuiSidebarHeader, { title: "Clean UI", subtitle: "Library" }),
        h(CuiSidebarContent, null, () => [
          h(CuiSidebarGroup, { label: "Layout", defaultExpanded: true }, () => h("a", { href: "/grid" }, "Grid")),
          h(CuiSidebarGroup, { label: "Forms" }, () => h("a", { href: "/input" }, "Input")),
        ]),
        h(CuiSidebarFooter, null, () => "Footer"),
      ]),
  });

describe("CuiSidebar renders on the server (node environment)", () => {
  it("renders the named nav with its parts and groups, without touching the DOM", async () => {
    const html = await renderToString(app());
    expect(html).toContain("<nav");
    expect(html).toContain('aria-label="Sidebar"');
    expect(html).toContain("Clean UI");
    expect(html).toContain("Footer");
    // No drawer, no menu button: the viewport is unknown until mount.
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("Navigation menu");
  });

  it("renders groups in their initial state, with ids that match between aria-controls and the panel", async () => {
    const html = await renderToString(app());
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-expanded="false"');
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
    expect(controls).toHaveLength(2);
    for (const id of controls) expect(html).toContain(`id="${id}"`);
  });

  it("renders identical markup on every render, even when asked to collapse", async () => {
    const first = await renderToString(app({ collapseBelow: "xl" }));
    const second = await renderToString(app({ collapseBelow: "xl" }));
    expect(first).toContain("cui-sidebar-group-");
    expect(second).toBe(first);
  });
});
