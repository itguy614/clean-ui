import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { readTag, script, sourceFiles, splitSelectorList, where } from "./css-helpers";

/** Every component in every package: the editor's roots have to be in scope too (#228). */
const COMPONENTS = sourceFiles(/\.vue$/);
const STYLES = resolve(__dirname, "..");

/** Every top-level element of a component's <template>, as raw start tags. */
function templateRoots(source: string): string[] {
  const open = source.indexOf("<template>");
  if (open === -1) return [];
  const body = source.slice(open + "<template>".length, source.lastIndexOf("</template>"));

  const roots: string[] = [];
  let depth = 0;
  let i = 0;
  while (i < body.length) {
    if (body.startsWith("<!--", i)) {
      const end = body.indexOf("-->", i);
      i = end === -1 ? body.length : end + 3;
      continue;
    }
    if (body[i] !== "<") {
      i++;
      continue;
    }
    if (body[i + 1] === "/") {
      depth--;
      const end = body.indexOf(">", i);
      i = end === -1 ? body.length : end + 1;
      continue;
    }
    const tag = readTag(body, i);
    if (depth === 0) roots.push(tag);
    if (!tag.trimEnd().endsWith("/>")) depth++;
    i += tag.length;
  }
  return roots;
}

/**
 * #72 — the library must not ship a page-wide reset. Tailwind's preflight is
 * global by construction (`*`, `html`, `a`, `ul`, `button`, …), so importing
 * `tailwindcss` put it in `dist/clean-ui.css` and every consumer inherited it:
 * zeroed heading and paragraph margins, no list markers, `border-width: 0`.
 * `./preflight.css` replaces it with the same rules scoped to `cui-*` subtrees.
 */
describe("no global reset ships from the library's CSS", () => {
  const css = Object.fromEntries(
    readdirSync(STYLES)
      .filter((f) => f.endsWith(".css"))
      .map((f) => [f, readFileSync(join(STYLES, f), "utf8")] as const),
  );

  it("never imports the full `tailwindcss` entrypoint", () => {
    // `tailwindcss/theme.css` is fine and intentional — it engages the engine so
    // the `@theme` block in theme.css is compiled instead of shipping raw. The
    // bare entrypoint is what drags preflight and the utilities layer along.
    // Every package's stylesheets, not just this one's: a satellite's CSS lands in the
    // consumer's page just the same (#228).
    for (const file of sourceFiles(/\.(css|vue)$/)) {
      expect(readFileSync(file, "utf8"), where(file)).not.toMatch(/@import\s+["']tailwindcss["']/);
    }
  });

  it("imports preflight.css into `@layer base`", () => {
    // Unlayered beats layered at any specificity, so an unlayered reset would
    // override a consumer's `@layer utilities` — which is where Tailwind puts
    // `px-3`, `mb-2` and the rest. Tailwind's own preflight sat in `base`.
    expect(css["main.css"]).toMatch(/@import\s+["']\.\/preflight\.css["']\s+layer\(base\)/);
    expect(css["main.css"]).toMatch(/@layer\s+theme,\s*base,\s*components,\s*utilities;/);
  });

  it("scopes every rule in preflight.css to a `cui-*` subtree", () => {
    const source = css["preflight.css"];
    expect(source).toBeDefined();

    // Strip comments, then check each selector list.
    const declarations = source.replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...declarations.matchAll(/(^|\})\s*([^{}@]+?)\s*\{/g)].map((m) => m[2].trim());

    expect(selectors.length).toBeGreaterThan(10);
    for (const selector of selectors) {
      for (const part of splitSelectorList(selector)) {
        expect(part, `unscoped selector in preflight.css: ${part}`).toMatch(
          /^:where\(\[class\^="cui-"\], \[class\*=" cui-"\]\)/,
        );
      }
    }
  });
});

/**
 * The scope is "an element with a `cui-*` class, and its descendants", so a
 * teleported panel that renders straight into `<body>` without a `cui-*` class
 * of its own lands outside it — no `box-sizing`, no `font: inherit` on the
 * inputs and buttons inside it. That breaks only for consumers who aren't
 * already supplying preflight themselves, which is exactly the case with no
 * other safety net, so guard it here.
 */
describe("teleported roots stay inside the scope", () => {
  it("gives every <Teleport> root element a cui-* class", () => {
    const offenders: string[] = [];

    for (const file of COMPONENTS) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/<Teleport\b[^>]*>\s*(?:<!--[\s\S]*?-->\s*)*(?=<[a-zA-Z])/g)) {
        let at = match.index + match[0].length;
        let rootTag = readTag(source, at);
        // A <Transition> around the teleported element (#263) isn't an element: look through it.
        while (/^<Transition(Group)?\b/.test(rootTag)) {
          at += rootTag.length;
          at += /^\s*/.exec(source.slice(at))![0].length;
          rootTag = readTag(source, at);
        }
        if (!/class="[^"]*\bcui-/.test(rootTag) && !/:class="[^"]*cui-/.test(rootTag)) {
          offenders.push(`${where(file)}: ${rootTag.split("\n")[0].trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  // #418 — a teleported root leaves the theme scope around the component too: each one binds
  // the classes useScopedTheme reads there. (A <TransitionGroup tag="div"> is the root itself.)
  it("carries the theme scope onto every <Teleport> root", () => {
    const offenders: string[] = [];

    for (const file of COMPONENTS) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/<Teleport\b[^>]*>\s*(?:<!--[\s\S]*?-->\s*)*(?=<[a-zA-Z])/g)) {
        let at = match.index + match[0].length;
        const tags = [readTag(source, at)];
        while (/^<Transition(Group)?\b/.test(tags.at(-1)!)) {
          at += tags.at(-1)!.length;
          at += /^\s*/.exec(source.slice(at))![0].length;
          tags.push(readTag(source, at));
        }
        const bound = tags.some((tag) => /:class="[^"]*\bthemeScope\b/.test(tag));
        if (!bound || !/\buseScopedTheme\(/.test(source)) offenders.push(`${where(file)}: ${tags.at(-1)!.split("\n")[0].trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

/**
 * The scoped base only reaches an element with a `cui-*` class and its
 * descendants, so a component whose own root has no such class renders its
 * whole subtree outside it — no `box-sizing`, no `font: inherit`. 36 of 106
 * roots were in that state when #72 shipped. This keeps them in.
 */
describe("every component root is inside the scope", () => {
  // Roots that cannot carry a class, and do not need to:
  const EXEMPT: Record<string, string> = {
    // Renderless: the root is <slot />, so there is no element of our own.
    "CuiConfigProvider.vue": "renderless",
    "CuiToastProvider.vue": "renderless (its toast container is classed separately)",
    // <Teleport> is not an element; the element it teleports carries the class.
    "CuiDropdownMenu.vue": "teleports .cui-dropdown-menu",
    "CuiListboxPanel.vue": "teleports .cui-listbox-panel",
    "CuiModal.vue": "teleports .cui-modal-overlay",
    "CuiSlideover.vue": "teleports .cui-slideover-overlay",
    // <Transition> is not an element either; the bar it wraps carries the class.
    "CuiDataGridBulkBar.vue": "wraps .cui-data-grid-bulk-bar in a <Transition>",
    "CuiAlert.vue": "wraps .cui-alert in a <Transition>, for its exit (#263)",
    "CuiTransition.vue": "wraps the consumer's own element in a <Transition>; the element carries their classes (#397)",
    "CuiTransitionGroup.vue": "a <TransitionGroup> with no tag is a fragment; with one it adds .cui-transition-group to the element it renders (#447)",
  };

  /**
   * A root that is another Cui component passes its static cui-* class to that component's
   * root by fallthrough — when there is a single root element to take it. A component
   * rooted at a <Teleport>, <Transition>, <slot /> or the like, or at several sibling roots,
   * has none: Vue drops the class with a warning. Those count only when they forward their
   * attributes, class included, to the element they render (`inheritAttrs: false`,
   * `v-bind="$attrs"` on a classed element), and are listed here — CuiConfirmDialog and the
   * editor's UrlDialog are rooted at CuiModal (#228). The chain is followed: a root at a
   * component that is itself rooted at a class-dropping one is out of scope too.
   */
  const FORWARDING = ["CuiModal", "CuiSlideover"];

  /** A root tag carrying a static `cui-*` class. */
  const hasStaticCuiClass = (root: string) => /\sclass="[^"]*\bcui-/.test(root);

  /** A root Vue renders no element of its own for. A TransitionGroup with a `tag` renders one. */
  const notAnElement = (root: string) =>
    /^<(slot|Teleport|Transition|KeepAlive|Suspense)(?![\w-])/.test(root) ||
    (/^<TransitionGroup(?![\w-])/.test(root) && !/\stag="/.test(root));

  const sourceOf = (component: string) => {
    const file = COMPONENTS.find((f) => f.endsWith(`/${component}.vue`));
    return file && readFileSync(file, "utf8");
  };

  /** `inheritAttrs: false` in the script itself, comments aside. */
  const optsOutOfFallthrough = (source: string) => /\binheritAttrs\s*:\s*false\b/.test(script(source));

  /** The template's start tags that bind `$attrs` and carry a static cui-* class. */
  function forwardedTo(source: string): string[] {
    const template = source.slice(source.indexOf("<template>"), source.lastIndexOf("</template>")).replace(/<!--[\s\S]*?-->/g, "");
    return [...template.matchAll(/<[A-Za-z]/g)]
      .map((m) => readTag(template, m.index!))
      .filter((tag) => /\sv-bind="\$attrs"/.test(tag) && hasStaticCuiClass(tag));
  }

  /** Whether a component receiving a class by fallthrough puts it on an element in the end. */
  function takesClass(component: string, seen = new Set<string>()): boolean {
    if (FORWARDING.includes(component)) return true;
    const source = sourceOf(component);
    if (!source || seen.has(component) || optsOutOfFallthrough(source)) return false;
    seen.add(component);
    const roots = templateRoots(source);
    // Several roots are a fragment, unless each after the first is a v-else branch.
    if (roots.slice(1).some((r) => !/\sv-else(-if)?\b/.test(r))) return false;
    return roots.every((r) => {
      if (notAnElement(r)) return false;
      const child = /^<(Cui[A-Za-z]+)\b/.exec(r)?.[1];
      return !child || takesClass(child, seen);
    });
  }

  function rootInScope(root: string): boolean {
    const component = /^<(Cui[A-Za-z]+)\b/.exec(root)?.[1];
    if (!component) return hasStaticCuiClass(root) || /:class="[^"]*cui-/.test(root);
    return hasStaticCuiClass(root) && takesClass(component);
  }

  it("scans every package's components, the editor's as well as clean-ui's", () => {
    // Every suite scans through `sourceFiles`, so this one check covers them all.
    expect(COMPONENTS.map(where)).toContain("clean-ui-editor/src/components/CuiMarkdownEditor.vue");
  });

  it("gives every root element a cui-* class", () => {
    const offenders: string[] = [];

    for (const file of COMPONENTS) {
      const name = file.split("/").pop()!;
      if (name in EXEMPT) continue;

      for (const root of templateRoots(readFileSync(file, "utf8"))) {
        if (!rootInScope(root)) {
          offenders.push(`${where(file)}: ${root.split("\n")[0].trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("lists only wrappers that really forward their attributes to a classed element", () => {
    for (const name of FORWARDING) {
      const source = sourceOf(name);
      expect(source, `${name} is listed as forwarding but no longer exists`).toBeDefined();
      expect(optsOutOfFallthrough(source!), `${name} must opt out of fallthrough`).toBe(true);
      expect(forwardedTo(source!), `${name} must bind $attrs on one cui-* classed element`).toHaveLength(1);
    }
  });

  it("keeps the exemption list honest", () => {
    // An exempt file that grew a normal root should drop off the list rather
    // than sit there excusing a real gap.
    for (const [name, why] of Object.entries(EXEMPT)) {
      const file = COMPONENTS.find((f) => f.endsWith("/" + name));
      expect(file, `${name} is exempt but no longer exists`).toBeDefined();
      const roots = templateRoots(readFileSync(file!, "utf8"));
      const exempted = roots.some(notAnElement);
      expect(exempted, `${name} is exempt as "${why}" but its roots no longer match`).toBe(true);
    }
  });
});
