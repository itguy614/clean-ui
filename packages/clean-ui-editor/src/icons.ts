import { registerIcons } from "@itguy614/clean-ui";
import { IconCode } from "@itguy614/clean-ui/icons/generated/code";
import { IconCodeBlock } from "@itguy614/clean-ui/icons/generated/code-block";
import { IconEye } from "@itguy614/clean-ui/icons/generated/eye";
import { IconImage } from "@itguy614/clean-ui/icons/generated/image";
import { IconLink } from "@itguy614/clean-ui/icons/generated/link";
import { IconListBullets } from "@itguy614/clean-ui/icons/generated/list-bullets";
import { IconListChecks } from "@itguy614/clean-ui/icons/generated/list-checks";
import { IconListNumbers } from "@itguy614/clean-ui/icons/generated/list-numbers";
import { IconMinus } from "@itguy614/clean-ui/icons/generated/minus";
import { IconQuotes } from "@itguy614/clean-ui/icons/generated/quotes";
import { IconTextB } from "@itguy614/clean-ui/icons/generated/text-b";
import { IconTextHOne } from "@itguy614/clean-ui/icons/generated/text-h-one";
import { IconTextHThree } from "@itguy614/clean-ui/icons/generated/text-h-three";
import { IconTextHTwo } from "@itguy614/clean-ui/icons/generated/text-h-two";
import { IconTextItalic } from "@itguy614/clean-ui/icons/generated/text-italic";
import { IconTextStrikethrough } from "@itguy614/clean-ui/icons/generated/text-strikethrough";

/**
 * Registers every icon the built-in formatting plugins reference by name, so
 * they render in a consumer app rather than falling back to the `?` placeholder.
 * Statically imported, so only these ~16 icons are bundled — regular weight only,
 * from clean-ui's generated set (#207), not clean-ui's lazy, any-name resolver and
 * not the six weights of each full Phosphor component. The mode toggle also draws
 * `eye`, which clean-ui no longer registers by default.
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
    bold: IconTextB,
    italic: IconTextItalic,
    strikethrough: IconTextStrikethrough,
    code: IconCode,
    "heading-1": IconTextHOne,
    "heading-2": IconTextHTwo,
    "heading-3": IconTextHThree,
    "list-bulleted": IconListBullets,
    "list-numbered": IconListNumbers,
    "list-task": IconListChecks,
    blockquote: IconQuotes,
    "code-block": IconCodeBlock,
    "horizontal-rule": IconMinus,
    link: IconLink,
    image: IconImage,
    eye: IconEye,
  });
}
