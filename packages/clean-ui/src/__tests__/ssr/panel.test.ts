import { describe, it, expect } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "@vue/server-renderer";
import CuiPanel from "../../components/CuiPanel.vue";
import CuiBackdrop from "../../components/CuiBackdrop.vue";
import { resolveGradient } from "../../utils/gradient";

// #406: no DOM in this environment, so only a real server render proves the gradient paint
// is computed without one.
describe("CuiPanel renders on the server (node environment)", () => {
  it("resolves a gradient with no DOM", () => {
    expect(typeof document).toBe("undefined");
    expect(resolveGradient({ from: "primary", to: "info", smooth: true })).not.toBeNull();
  });

  it("renders the panel with its gradient layers and the static class", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(CuiPanel, { as: "section", from: "primary", to: "info", smooth: true, rounded: "lg" }, () => "hello"),
      }),
    );
    expect(html).toContain("<section");
    expect(html).toContain("cui-panel");
    expect(html).toContain("--_panel-bg:");
    expect(html).toContain("--_panel-bg-modern:");
    expect(html).toContain("hello");
  });

  it("renders a backdrop with a gradient", async () => {
    const html = await renderToString(createSSRApp({ render: () => h(CuiBackdrop, { from: "primary", to: "info" }) }));
    expect(html).toContain("--_backdrop-bg-modern:");
  });
});
