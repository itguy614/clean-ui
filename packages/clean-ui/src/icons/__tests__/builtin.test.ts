import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { BUILTIN_ICONS } from "../builtin";
import { COLOR_ICON_MAP } from "../../utils/colorIconMap";

const SRC = resolve(__dirname, "../..");
const ROOT = resolve(SRC, "../../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "__tests__" ? [] : walk(path);
    return [path];
  });
}

/** Every <CuiIcon …> opening tag in a template. */
const ICON_TAG = /<CuiIcon\b(?:"[^"]*"|'[^']*'|[^>"'])*?\/?>/g;
const components = () => walk(join(SRC, "components")).filter((f) => f.endsWith(".vue"));
const rel = (file: string) => file.replace(SRC + "/", "");

/**
 * #207: the icon graph follows the component graph. A component imports the generated
 * icon it draws and hands the component to `CuiIcon`, so the icons a consumer pays for are
 * the components it uses, and the built-in *names* (`icons/builtin`) are an opt-in that
 * nothing loads by default. These tests are the guards for each half.
 */
describe("built-in icons: the structure", () => {
  it("no component imports @phosphor-icons/vue: they import the generated icons", () => {
    // No documented exemptions. A component that must draw a full-weight Phosphor icon takes
    // it as a prop from the consumer instead.
    const offenders = [...components(), ...walk(join(SRC, "icons")), ...walk(join(SRC, "composables")), ...walk(join(SRC, "utils"))]
      .filter((f) => !/icons\/lazy\.ts$/.test(f)) // the opt-in any-name resolver, by design
      .filter((f) => /^\s*(?:import|export)\b[^;]*?from\s*["']@phosphor-icons\/vue["']|\bimport\s*\(\s*["']@phosphor-icons\/vue["']/m.test(readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*/gm, "")))
      .map(rel);
    expect(offenders, "import the icon from icons/generated/<name> instead").toEqual([]);
  });

  it("no component names one of its own icons with a string literal", () => {
    // A literal `name="x"` (or a quoted literal inside :name) is a built-in name the component
    // would only resolve if the app had opted into icons/builtin. Names that arrive as data
    // (`:name="option.icon"`) are the consumer's and stay.
    const offenders: string[] = [];
    for (const file of components()) {
      const src = readFileSync(file, "utf8");
      for (const tag of src.match(ICON_TAG) ?? []) {
        if (/(?<![:\w-])name="[a-z0-9-]+"/.test(tag) || /:name="[^"]*'[a-z0-9-]+'/.test(tag)) {
          offenders.push(`${rel(file)}: ${tag.replace(/\s+/g, " ").slice(0, 80)}`);
        }
      }
    }
    expect(offenders, "pass the icon: <CuiIcon :icon=\"IconCaretDown\" />").toEqual([]);
  });

  it("no component passes a built-in name as a string icon prop to another component", () => {
    const offenders: string[] = [];
    for (const file of components()) {
      for (const m of readFileSync(file, "utf8").matchAll(/<Cui\w+\b[^>]*?(?<![:\w-])icon="([a-z0-9-]+)"/g)) offenders.push(`${rel(file)}: icon="${m[1]}"`);
    }
    expect(offenders, "pass the component: :icon=\"IconMagnifyingGlass\"").toEqual([]);
  });

  it("nothing reachable from the barrel loads the built-in names, the lazy resolver or the icon set", () => {
    const seen = new Set<string>();
    const queue = [join(SRC, "index.ts")];
    const resolveImport = (from: string, spec: string) =>
      [spec, spec + ".ts", spec + ".vue", join(spec, "index.ts")]
        .map((s) => resolve(dirname(from), s))
        .find((p) => existsSync(p) && statSync(p).isFile());
    while (queue.length) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
      for (const m of code.matchAll(/(?:from|import)\s*\(?\s*["'](\.[^"']+)["']/g)) {
        const target = resolveImport(file, m[1]);
        if (target) queue.push(target);
      }
    }
    const forbidden = ["icons/builtin.ts", "icons/lazy.ts", "icons/generated/index.ts"];
    const reached = [...seen].map(rel).filter((f) => forbidden.includes(f));
    expect(reached, "the barrel must not import these").toEqual([]);
    // The scan itself still sees the generated modules the components import.
    expect([...seen].map(rel)).toContain("icons/generated/caret-down.ts");
  });
});

describe("generated icons", () => {
  it("regenerating from @phosphor-icons/core produces no diff", async () => {
    const generator = (await import(pathToFileURL(join(ROOT, "scripts/generate-icons.mjs")).href)) as {
      generate(): Record<string, string>;
      GENERATED_DIR: string;
    };
    const files = generator.generate();
    const dir = generator.GENERATED_DIR;
    const stale = readdirSync(dir).filter((f) => !(f in files));
    const changed = Object.entries(files)
      .filter(([f, content]) => !existsSync(join(dir, f)) || readFileSync(join(dir, f), "utf8") !== content)
      .map(([f]) => f);
    expect([...changed, ...stale], "run node scripts/generate-icons.mjs").toEqual([]);
  });

  it("uses kebab-case keys, matching what the name prop takes", () => {
    const wrong = Object.keys(BUILTIN_ICONS).filter((k) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(k));
    expect(wrong).toEqual([]);
  });

  it("maps every name to a real component that carries the regular weight", () => {
    const broken = Object.entries(BUILTIN_ICONS)
      .filter(([, c]) => !c || !(c as { iconWeights?: string[] }).iconWeights?.includes("regular"))
      .map(([name]) => name);
    expect(broken).toEqual([]);
  });

  it("carries only the weights the library draws", () => {
    const weights = Object.fromEntries(
      Object.entries(BUILTIN_ICONS).map(([n, c]) => [n, (c as { iconWeights: string[] }).iconWeights]),
    );
    const extra = Object.entries(weights).filter(([, w]) => w.some((x) => !["regular", "bold", "fill"].includes(x)));
    expect(extra).toEqual([]);
    expect(weights.check).toEqual(["regular", "bold"]);
    expect(weights.circle).toEqual(["regular", "fill"]);
    expect(weights["caret-down"]).toEqual(["regular"]);
  });

  it("every weight a component draws is carried by the icon it draws", () => {
    // Each `weight="x"` beside a literal icon: check/minus bold, circle fill. Rating draws
    // star and star-half at fill. Anything else a component starts drawing must be added to
    // ICONS in scripts/generate-icons.mjs.
    const drawn: Record<string, string> = { check: "bold", minus: "bold", circle: "fill", star: "fill", "star-half": "fill" };
    for (const [name, weight] of Object.entries(drawn)) {
      expect((BUILTIN_ICONS[name] as { iconWeights: string[] }).iconWeights).toContain(weight);
    }
    for (const file of components()) {
      for (const tag of readFileSync(file, "utf8").match(ICON_TAG) ?? []) {
        const weight = tag.match(/(?<![:\w-])weight="(\w+)"/)?.[1];
        const icon = tag.match(/:icon="Icon(\w+)"/)?.[1];
        if (!weight || !icon) continue;
        const name = icon.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
        expect((BUILTIN_ICONS[name] as { iconWeights: string[] }).iconWeights, `${rel(file)}: ${name}`).toContain(weight);
      }
    }
  });

  it("covers every COLOR_ICON_MAP value (CuiAlert / CuiToast / CuiBanner auto-icons)", () => {
    const set = new Set(Object.values(BUILTIN_ICONS));
    const missing = Object.entries(COLOR_ICON_MAP).filter(([, icon]) => !set.has(icon)).map(([role]) => role);
    expect(missing).toEqual([]);
  });
});
