import preflight from "../../styles/preflight.css?inline";

/**
 * Shared setup for the real-browser project.
 *
 * Every browser suite needs the library's scoped base, and several need the
 * focus-ring token: the rule is `outline: 2px solid var(--cui-primary-focus-ring)`,
 * and an undefined custom property makes the whole declaration invalid at
 * computed-value time — `outline-style` falls back to `none` and a ring
 * assertion reads "no ring" for entirely the wrong reason.
 *
 * This lived as a copy-pasted `beforeAll` in six suites before; the browser
 * project simply had no `setupFiles`, unlike the jsdom one.
 */
const style = document.createElement("style");
style.textContent = `
  @layer theme, base, components, utilities;
  @layer base { ${preflight} }
  :root { --cui-primary-focus-ring: rgba(59, 70, 200, 0.4); }
`;
document.head.append(style);
