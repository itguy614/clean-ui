#!/usr/bin/env node
/**
 * Scaffold a new Clean UI component following the project conventions.
 *
 *   node scripts/new-component.mjs <Name> [--context] [--group "<Group>"]
 *
 * Example:
 *   node scripts/new-component.mjs Rating --group "Data Display"
 *   node scripts/new-component.mjs SegmentedControl --context --group "Form Controls"
 *
 * Creates:
 *   packages/clean-ui/src/components/Cui<Name>.vue
 *   packages/clean-ui/src/components/<kebab>-context.ts        (with --context)
 *   apps/docs/src/pages/<Name>Page.vue
 * And wires up:
 *   packages/clean-ui/src/index.ts        (import, export, type export, plugin)
 *   apps/docs/src/router/index.ts         (route)
 *   apps/docs/src/components/Navigation.vue (nav entry under --group)
 *
 * Run the library build afterwards: `npm run build -w packages/clean-ui`
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GROUPS = ["Layout", "Form Controls", "Actions", "Feedback", "Data Display", "Navigation", "Overlay"];

// ---- args ----
const args = process.argv.slice(2);
let rawName = "";
let withContext = false;
let group = "Layout";
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--context") withContext = true;
  else if (a === "--group") group = args[++i];
  else if (!a.startsWith("--")) rawName = a;
}

if (!rawName) {
  console.error("Usage: node scripts/new-component.mjs <Name> [--context] [--group \"<Group>\"]");
  process.exit(1);
}
if (!GROUPS.includes(group)) {
  console.error(`Unknown --group "${group}". Valid groups:\n  ${GROUPS.join("\n  ")}`);
  process.exit(1);
}

// ---- names ----
const name = rawName.replace(/^Cui/, "").replace(/[^A-Za-z0-9]/g, "");
if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  console.error(`Name must be PascalCase (got "${rawName}").`);
  process.exit(1);
}
const comp = `Cui${name}`;
const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const label = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
const routePath = `/components/${kebab}`;

const compFile = resolve(ROOT, `packages/clean-ui/src/components/${comp}.vue`);
const ctxFile = resolve(ROOT, `packages/clean-ui/src/components/${kebab}-context.ts`);
const pageFile = resolve(ROOT, `apps/docs/src/pages/${name}Page.vue`);
const indexFile = resolve(ROOT, "packages/clean-ui/src/index.ts");
const routerFile = resolve(ROOT, "apps/docs/src/router/index.ts");
const navFile = resolve(ROOT, "apps/docs/src/components/Navigation.vue");

if (existsSync(compFile)) {
  console.error(`Refusing to overwrite existing component: ${comp}.vue`);
  process.exit(1);
}

const sub = (tpl) =>
  tpl
    .replaceAll("__COMP__", comp)
    .replaceAll("__NAME__", name)
    .replaceAll("__KEBAB__", kebab)
    .replaceAll("__LABEL__", label);

// ---- templates ----
const componentTpl = [
  '<script setup lang="ts">',
  'import { useTemplateRef } from "vue";',
  'import type { HideableProps } from "../types/common";',
  '// Compose more shared mixins as needed: ColorableProps (color: CuiColor),',
  '// SizeableProps (size: CuiSize), DisableableProps (disabled), FormControlProps.',
  '// For a size scale, narrow via clampSize() from "../utils/sizing".',
  '',
  'export interface __COMP__Props extends HideableProps {',
  '  /** TODO: add component-specific props */',
  '}',
  '',
  'withDefaults(defineProps<__COMP__Props>(), {',
  '  hidden: false,',
  '});',
  '',
  '// Interactive components expose an imperative handle:',
  'const elRef = useTemplateRef<HTMLElement>("rootEl");',
  'function focus(opts?: FocusOptions) { elRef.value?.focus(opts); }',
  'function blur() { elRef.value?.blur(); }',
  'defineExpose({ el: elRef, focus, blur });',
  '</' + 'script>',
  '',
  '<template>',
  '  <div ref="rootEl" v-show="!hidden" class="cui-__KEBAB__">',
  '    <slot />',
  '  </div>',
  '</template>',
  '',
  '<style scoped>',
  '/* Use semantic tokens only — var(--cui-surface-base), var(--cui-border),',
  '   var(--cui-{role}) / -bg / -border. Never hardcode colors (breaks themes). */',
  '.cui-__KEBAB__ {',
  '  color: var(--cui-text-body);',
  '}',
  '</style>',
  '',
].join("\n");

const contextTpl = [
  'import type { InjectionKey, Ref } from "vue";',
  '',
  'export interface __NAME__Context {',
  '  // shared reactive state provided to descendants, e.g.:',
  '  // value: Ref<string | undefined>;',
  '}',
  '',
  'export const __NAME__Key: InjectionKey<__NAME__Context> = Symbol("cui-__KEBAB__");',
  '',
].join("\n");

const pageTpl = [
  '<script setup lang="ts">',
  'import { __COMP__, CuiStack } from "@itguy614/clean-ui";',
  'import PropTable from "../components/PropTable.vue";',
  'import Example from "../components/Example.vue";',
  '</' + 'script>',
  '',
  '<template>',
  '  <CuiStack spacing="8">',
  '    <div>',
  '      <h1 class="text-4xl font-bold">__LABEL__</h1>',
  '      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">',
  '        TODO: describe __LABEL__.',
  '      </p>',
  '    </div>',
  '',
  '    <div>',
  '      <h2 class="mb-4 text-2xl font-semibold">Props</h2>',
  '      <PropTable :props="[',
  "        { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },",
  '      ]" />',
  '    </div>',
  '',
  '    <div>',
  '      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>',
  '      <CuiStack spacing="6">',
  '        <Example title="Basic" :code="`<__COMP__>Hello</__COMP__>`">',
  '          <__COMP__>Hello</__COMP__>',
  '        </Example>',
  '      </CuiStack>',
  '    </div>',
  '  </CuiStack>',
  '</template>',
  '',
].join("\n");

// ---- write new files ----
writeFileSync(compFile, sub(componentTpl));
if (withContext) writeFileSync(ctxFile, sub(contextTpl));
writeFileSync(pageFile, sub(pageTpl));

// ---- wire up library index.ts ----
{
  const lines = readFileSync(indexFile, "utf8").split("\n");
  const importRe = /^import Cui\w+ from "\.\/components\/Cui\w+\.vue";$/;
  const typeRe = /^export type \{ Cui\w+Props.*\} from "\.\/components\/Cui\w+\.vue";$/;
  const appRe = /^\s*app\.component\("Cui\w+", Cui\w+\);$/;
  const lastIdx = (re) => { let n = -1; lines.forEach((l, i) => { if (re.test(l)) n = i; }); return n; };

  lines.splice(lastIdx(importRe) + 1, 0, `import ${comp} from "./components/${comp}.vue";`);
  lines.splice(lastIdx(typeRe) + 1, 0, `export type { ${comp}Props } from "./components/${comp}.vue";`);
  lines.splice(lastIdx(appRe) + 1, 0, `      app.component("${comp}", ${comp});`);

  // component export list (single long `export { ... };` line)
  const expIdx = lines.findIndex((l) => l.startsWith("export {") && l.includes("Cui") && l.trimEnd().endsWith("};"));
  lines[expIdx] = lines[expIdx].replace(/ \};\s*$/, `, ${comp} };`);

  writeFileSync(indexFile, lines.join("\n"));
}

// ---- wire up docs router ----
{
  let txt = readFileSync(routerFile, "utf8");
  const route = `    {\n      path: '${routePath}',\n      name: '${kebab}',\n      component: () => import('../pages/${name}Page.vue'),\n    },\n`;
  txt = txt.replace(/(\n {2}routes: \[\n)/, `$1${route}`);
  writeFileSync(routerFile, txt);
}

// ---- wire up docs nav (appends before sections `];`; groups via reduce so it lands at end of its group) ----
{
  let txt = readFileSync(navFile, "utf8");
  const entry = `  { id: "${kebab}", label: "${label}", path: "${routePath}", group: "${group}" },\n`;
  txt = txt.replace(/\n\];\n\nconst groupedSections/, `\n${entry}];\n\nconst groupedSections`);
  writeFileSync(navFile, txt);
}

console.log(`✓ Created ${comp}`);
console.log(`  • packages/clean-ui/src/components/${comp}.vue`);
if (withContext) console.log(`  • packages/clean-ui/src/components/${kebab}-context.ts`);
console.log(`  • apps/docs/src/pages/${name}Page.vue`);
console.log(`  • registered in index.ts, router, and nav ("${group}")`);
console.log(`\nNext:`);
console.log(`  1. Implement ${comp}.vue (props, a11y, semantic tokens).`);
console.log(`  2. Build the library:  npm run build -w packages/clean-ui`);
console.log(`  3. Clear docs cache:   rm -rf apps/docs/node_modules/.vite`);
console.log(`  4. Flesh out the docs page + PropTable.`);
