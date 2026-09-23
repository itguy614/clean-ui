import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { h } from "vue";
import { mount } from "@vue/test-utils";
import main from "../../styles/main.css?inline";
import CuiFieldset from "../../components/CuiFieldset.vue";
import CuiInput from "../../components/CuiInput.vue";

/**
 * A field's focus ring is drawn OUTSIDE its own box — a 2px box-shadow on inputs, a 2px
 * outline at 2px offset on checkboxes and radios. `CuiFieldset` clips its content with
 * `overflow: hidden`, which it needs for the collapse animation, and its content box had
 * no padding, so a full-width field sat flush against the clip edge and its ring was cut
 * off: on the left and right of every field, and on the top and bottom of the first and
 * last one.
 *
 * Real browser: this is laid-out geometry against a clipping ancestor, which jsdom does
 * not model at all.
 */
describe("CuiFieldset leaves room for a field's focus ring (real browser)", () => {
  beforeAll(() => {
    const style = document.createElement("style");
    style.id = "cui-tokens";
    // `--color-*` comes from the Tailwind `@theme`, inert in a raw stylesheet — and an
    // unresolved var invalidates the `border` shorthand, which moves every measurement.
    style.textContent = `${main}
      :root {
        --color-surface-50:#fafafa; --color-surface-100:#f4f4f5; --color-surface-200:#e4e4e7;
        --color-surface-300:#d4d4d8; --color-surface-400:#a1a1aa; --color-surface-500:#71717a;
        --color-surface-600:#52525b; --color-surface-700:#3f3f46; --color-surface-800:#27272a;
        --color-surface-900:#18181b; --color-surface-950:#09090b;
        --color-primary-100:#e0e7ff; --color-primary-300:#a5b4fc; --color-primary-500:#4f46e5;
        --color-primary-700:#3730a3; --color-primary-900:#1e1b4b;
      }`;
    document.head.append(style);
  });

  afterAll(() => document.getElementById("cui-tokens")?.remove());

  const hosts: HTMLElement[] = [];
  afterEach(() => hosts.splice(0).forEach((h) => h.remove()));

  /** The widest ring the library draws: outline 2px at offset 2px. */
  const RING = 4;

  function fieldset(props: Record<string, unknown> = {}) {
    const host = document.createElement("div");
    host.style.width = "360px";
    document.body.append(host);
    hosts.push(host);
    const w = mount(CuiFieldset, {
      props: { legend: "Details", ...props },
      slots: { default: () => [h(CuiInput, { size: "md" }), h(CuiInput, { size: "md" })] },
      attachTo: host,
    });
    const root = w.element as HTMLElement;
    return {
      root,
      content: root.querySelector<HTMLElement>(".cui-fieldset__content")!,
      fields: Array.from(root.querySelectorAll<HTMLElement>(".cui-input")),
    };
  }

  it("clears the ring on every side of every field", () => {
    const { content, fields } = fieldset();
    const box = content.getBoundingClientRect();

    expect(fields).toHaveLength(2);
    for (const [i, field] of fields.entries()) {
      const r = field.getBoundingClientRect();
      expect(r.left - box.left, `field ${i} left`).toBeGreaterThanOrEqual(RING);
      expect(box.right - r.right, `field ${i} right`).toBeGreaterThanOrEqual(RING);
      expect(r.top - box.top, `field ${i} top`).toBeGreaterThanOrEqual(RING);
      expect(box.bottom - r.bottom, `field ${i} bottom`).toBeGreaterThanOrEqual(RING);
    }
  });

  it("does not shift the fields, and keeps the fieldset its original width", () => {
    // The gutter is padding cancelled by a negative margin, so nothing may move.
    const { root, fields } = fieldset();
    const fr = root.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(root).borderLeftWidth);
    const padding = parseFloat(getComputedStyle(root).paddingLeft);

    expect(Math.round(fields[0].getBoundingClientRect().left - fr.left)).toBe(Math.round(border + padding));
    expect(Math.round(fr.width)).toBe(360);
  });

  it("still collapses to nothing", () => {
    // Padding survives `max-height: 0` under border-box, so a gutter left on all four
    // sides while collapsed would hold the content open by 8px.
    const { content } = fieldset({ collapsible: true, expanded: false });

    expect(Math.round(content.getBoundingClientRect().height)).toBe(0);
  });
});
