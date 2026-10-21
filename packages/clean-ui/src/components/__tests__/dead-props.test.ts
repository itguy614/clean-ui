import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * #212: two props were declared, defaulted, documented as working — and read by nothing, so
 * a consumer setting them saw nothing happen and had no way to tell why. Seven such props
 * existed at once. Every prop in a component's interface must be used somewhere outside the
 * interface, its `withDefaults` and any comment.
 *
 * What it can't see: props inherited through `extends` mixins (HideableProps and so on), any
 * interface after the first `Cui*Props` in a file, and quoted keys or method signatures.
 */
const COMPONENTS = join(dirname(fileURLToPath(import.meta.url)), "..");

// Known dead props, each with the issue that fixes or removes it. A stale entry fails too.
const EXEMPT: Record<string, string> = {
  "CuiAvatarGroup.vue:max": "#164",
  "CuiTimeline.vue:compact": "#164",
  "CuiToast.vue:toastId": "#164",
  "CuiTimePicker.vue:minTime": "#178",
  "CuiTimePicker.vue:maxTime": "#178",
};

function deadProps(file: string): string[] {
  const source = readFileSync(join(COMPONENTS, file), "utf8");
  const iface = source.match(/export interface Cui\w*Props[^{]*\{([\s\S]*?)\n\}/);
  if (!iface) return [];
  const props = [...iface[1].matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
  const rest = source
    .replace(iface[0], "")
    // Non-greedy, so a generic `defineProps<CuiDataGridProps<T>>()` is stripped too.
    .replace(/withDefaults\(defineProps<[\s\S]*?>\(\),\s*\{[\s\S]*?\n\}\)/, "")
    // A stylesheet reads a prop only through v-bind(), so keep those and drop the rest: its
    // comments would pair with a "/*" in a script string (an `image/*` accept pattern) and
    // swallow everything between.
    .replace(/<style[\s\S]*?<\/style>/g, (css) => (css.match(/v-bind\([^)]*\)/g) ?? []).join(" "))
    // A prop mentioned only in a comment is still dead.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  // camelCase only: a prop used in a template expression or script is always written that
  // way, and a kebab-case substring match would let `max` pass on `max-height`.
  return props.filter((p) => !new RegExp(`\\b${p}\\b`).test(rest)).map((p) => `${file}:${p}`);
}

describe("component props", () => {
  const dead = readdirSync(COMPONENTS).filter((f) => f.endsWith(".vue")).flatMap(deadProps);

  it("are all read by the component", () => {
    expect(dead.filter((d) => !(d in EXEMPT))).toEqual([]);
  });

  it("keep the exemption list honest", () => {
    expect(Object.keys(EXEMPT).filter((d) => !dead.includes(d))).toEqual([]);
  });
});
