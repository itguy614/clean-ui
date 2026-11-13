/**
 * Opt-in name registration for the library's built-in icons (#207).
 *
 * ```ts
 * import "@itguy614/clean-ui/icons/builtin";
 * ```
 *
 * Registers every icon clean-ui draws itself under its kebab-case name, so
 * `<CuiIcon name="caret-down" />`, an `icon: "user"` option on a select, or
 * `<CuiAlert icon="check-circle">` resolve to the built-ins. Nothing imports this module
 * by default, and the components do not need it: each one imports the icon it draws and
 * passes the component to `CuiIcon` (`<CuiIcon :icon="IconCaretDown" />`), so the icons a
 * consumer pays for follow the components it uses. Importing this adds all ~55 (about
 * 6 kB gzip), which is the point of keeping it separate, like `icons/lazy`.
 *
 * The built-in set carries only the weights the library itself draws: regular for all
 * of them, bold for `check` and `minus`, fill for `circle`, `star` and `star-half`.
 * `weight="duotone"` (or thin, light) on one of these names draws the regular weight
 * and warns in development. For the full six weights, register the Phosphor component
 * over the name:
 *
 * ```ts
 * import { registerIcons } from "@itguy614/clean-ui";
 * import { PhCaretDown } from "@phosphor-icons/vue";
 * registerIcons({ "caret-down": PhCaretDown });
 * ```
 *
 * Or pass a component directly: `<CuiIcon :icon="PhCaretDown" weight="duotone" />`.
 */
import { hasIcon, registerIcons } from "./registry";
import { BUILTIN_ICONS } from "./generated";

export * from "./generated";

/**
 * Register the built-in names. Called when this module is imported; exported as well so
 * the intent can be explicit at a call site. Registrations made earlier by the app win,
 * because it only fills names that are not registered yet.
 */
export function registerBuiltinIcons(): void {
  registerIcons(Object.fromEntries(Object.entries(BUILTIN_ICONS).filter(([name]) => !hasIcon(name))));
}

registerBuiltinIcons();
