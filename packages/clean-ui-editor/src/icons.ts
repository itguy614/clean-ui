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
 * Registers every icon the built-in formatting plugins reference by name
 * (task 4.1.1: "Icons used are registered by this package, so they render in
 * a consumer app rather than falling back to a placeholder glyph"). Statically
 * imported, so only these ~15 icons are bundled — not clean-ui's lazy,
 * any-name resolver.
 */
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
