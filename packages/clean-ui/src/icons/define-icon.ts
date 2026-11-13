import { defineComponent, h, renderSlot, type Component, type VNode } from "vue";
import type { IconWeight } from "../components/CuiIcon.vue";

/** A child of the icon's `<g>`: a path's `d`, or any other element as `[tag, attrs]`. */
export type IconShape = string | [tag: string, attrs: Record<string, string>];

/** The shapes of each weight an icon carries. Always has `regular`. */
export type IconWeights = Partial<Record<IconWeight, IconShape[]>> & { regular: IconShape[] };

/** An icon component that knows which weights it carries (CuiIcon reads it to warn). */
export type BuiltinIcon = Component & { readonly iconWeights: readonly IconWeight[] };

/**
 * Builds one built-in icon: a `<svg><g>…</g></svg>` render function over the weights the
 * library itself draws. Same props, markup and attribute order as an `@phosphor-icons/vue`
 * component (`weight`, `size`, `color`, `mirrored`, a default slot, attrs on the svg), so
 * a built-in renders identically to the Phosphor one it replaces. A weight the icon does
 * not carry draws the regular one, and CuiIcon warns in development. The generated files
 * (scripts/generate-icons.mjs) are the only callers.
 */
export function defineIcon(name: string, weights: IconWeights): BuiltinIcon {
  const component = defineComponent({
    name: `CuiIcon${name}`,
    props: {
      weight: { type: String },
      size: { type: [String, Number] },
      color: { type: String },
      mirrored: { type: Boolean },
    },
    setup(props, { slots }) {
      return () => {
        const shapes = weights[(props.weight ?? "regular") as IconWeight] ?? weights.regular;
        const size = props.size ?? "1em";
        return h(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 256 256",
            width: size,
            height: size,
            fill: props.color ?? "currentColor",
            transform: props.mirrored ? "scale(-1, 1)" : undefined,
          },
          [
            // renderSlot, as Phosphor does: an empty slot still leaves its fragment anchors in the DOM,
            // so a built-in's DOM is the same as the component it replaces, not only its pixels.
            renderSlot(slots, "default"),
            h(
              "g",
              shapes.map((shape): VNode => (typeof shape === "string" ? h("path", { d: shape }) : h(shape[0], shape[1]))),
            ),
          ],
        );
      };
    },
  });
  return Object.assign(component, { iconWeights: Object.keys(weights) as IconWeight[] });
}
