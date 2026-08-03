import { registerIcons } from "@itguy614/clean-ui";
import {
  PhTextB,
  PhTextItalic,
  PhTextStrikethrough,
  PhCode,
  PhTextHOne,
  PhTextHTwo,
  PhTextHThree,
  PhListBullets,
  PhListNumbers,
  PhListChecks,
  PhQuotes,
  PhCodeBlock,
  PhMinus,
  PhLink,
  PhImage,
} from "@phosphor-icons/vue";

/**
 * Registers every icon the built-in formatting plugins reference by name, so
 * they render in a consumer app rather than falling back to the `?` placeholder.
 * Statically imported, so only these ~15 icons are bundled — not clean-ui's lazy,
 * any-name resolver.
 *
 * Exposed as a **function that CuiMarkdownEditor calls** (see issue #86) rather
 * than a bare module-load side effect: a side-effect-only module can be proven
 * unused and tree-shaken out of a consumer build even when listed in
 * `sideEffects`, which left every toolbar button rendering `?`. A value the
 * component references cannot be dropped. Idempotent — safe to call more than once.
 */
let registered = false;

export function registerEditorIcons(): void {
  if (registered) return;
  registered = true;
  registerIcons({
    bold: PhTextB,
    italic: PhTextItalic,
    strikethrough: PhTextStrikethrough,
    code: PhCode,
    "heading-1": PhTextHOne,
    "heading-2": PhTextHTwo,
    "heading-3": PhTextHThree,
    "list-bulleted": PhListBullets,
    "list-numbered": PhListNumbers,
    "list-task": PhListChecks,
    blockquote: PhQuotes,
    "code-block": PhCodeBlock,
    "horizontal-rule": PhMinus,
    link: PhLink,
    image: PhImage,
  });
}
