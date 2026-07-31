import { StateField, StateEffect, Facet } from "@codemirror/state";

/**
 * FR27/FR29: the reveal layer only hides markers for constructs whose
 * owning plugin is actually loaded — excluding a plugin (e.g. italic) means
 * its markers stay unstyled, literal text, not merely "no toolbar button
 * for it." Driven from the active plugin registry's `decorations` (see
 * `CuiMarkdownEditor.vue`'s `pluginsCompartment` wiring), not a hardcoded
 * list — a third-party plugin's own `decorations: [{node: "..."}]` entry
 * works automatically, since `reveal-plugin.ts`'s marker-hiding mechanism is
 * already generic over any node name.
 */
export const setActiveConstructsEffect = StateEffect.define<ReadonlySet<string>>();

// Seeds `activeConstructsField`'s initial value at EditorState construction —
// both extensions are added together (see `activeConstructsExtension`), so
// the field's `create()` sees this facet already resolved. Reconfiguring
// after that point goes through `setActiveConstructsEffect`, not this facet.
const initialActiveConstructsFacet = Facet.define<ReadonlySet<string>, ReadonlySet<string>>({
  combine: (values) => values[values.length - 1] ?? new Set(),
});

export const activeConstructsField = StateField.define<ReadonlySet<string>>({
  create: (state) => state.facet(initialActiveConstructsFacet),
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setActiveConstructsEffect)) return effect.value;
    }
    return value;
  },
});

export function activeConstructsExtension(initial: ReadonlySet<string>) {
  return [initialActiveConstructsFacet.of(initial), activeConstructsField];
}
