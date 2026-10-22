/**
 * The motion tokens' names, and their defaults in ms: what `styles/main.css` declares on
 * `:root` (#261). Keep the two in step — `utils/__tests__/motion.test.ts` checks them.
 */
export const MOTION_DURATIONS = {
  instant: 0,
  press: 120,
  fast: 150,
  base: 200,
  slow: 250,
} as const;

export type MotionDuration = keyof typeof MOTION_DURATIONS;

import { warnOnce } from "./devWarn";

/**
 * Whether the user asked for reduced motion (#265). Read when it matters, not cached: the
 * setting can change while the page is open. False under server rendering.
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

/** A CSS time — `150ms`, `0.2s` — in ms; null for anything else. */
function parseTime(value: string): number | null {
  const m = /^(-?\d*\.?\d+)(ms|s)$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * (m[2] === "s" ? 1000 : 1);
}

/**
 * A motion token's duration in ms, as it resolves on `el` (the document root by default),
 * so a JS wait follows the CSS it waits for, overrides included. Read it when the wait
 * starts, not at setup: a container's override, or a theme, may change it.
 *
 * Falls back to the token's default under server rendering, or where the token isn't
 * set (a consumer who loads no library CSS, a test DOM).
 */
export function motionDuration(name: MotionDuration, el?: Element | null): number {
  const fallback = MOTION_DURATIONS[name];
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(el ?? document.documentElement).getPropertyValue(`--cui-duration-${name}`).trim();
  if (!raw) return fallback;
  const ms = parseTime(raw);
  if (ms === null) {
    // A custom property's computed value keeps `calc()` and `var()` unresolved, so JS can't
    // read one; the CSS still animates over it, and the wait would no longer match.
    warnOnce(`[clean-ui] --cui-duration-${name} is "${raw}": set it to a plain time (150ms, 0.2s) so JavaScript waits can match it. Using ${fallback}ms.`);
    return fallback;
  }
  return ms;
}

/**
 * A `<Transition :css="false">` leave hook (#263): finishes the leave once the exit has
 * played — the animations running on `el` itself and on any descendant marked
 * `data-cui-exit` (a modal's backdrop and dialog), which `<Transition>`'s CSS mode can't see
 * (it reads only the element). Not the whole subtree: an unrelated animation in the content,
 * a progress bar or a hover, mustn't hold the close up. Settled, not finished: a re-open
 * reverses the transitions, cancelling these, and `<Transition>` then ignores this `done`.
 * A loop (an alert's pulse) never ends, so it isn't waited for. Finishes at once with
 * nothing running, and in an environment without the Web Animations API (jsdom).
 */
export function afterAnimations(el: Element, done: () => void): void {
  const owners = [el, ...el.querySelectorAll("[data-cui-exit]")];
  const running = owners
    .flatMap((owner) => (typeof owner.getAnimations === "function" ? owner.getAnimations() : []))
    .filter((a) => a.effect?.getTiming().iterations !== Infinity);
  if (!running.length) {
    done();
    return;
  }
  Promise.allSettled(running.map((a) => a.finished)).then(() => done());
}

/**
 * The panel's motion state, `data-cui-panel="shown" | "hidden"`. An attribute, not a
 * class: Vue rewrites `className` whenever a panel's own `:class` binding changes (a
 * tooltip flipping sides as it opens), which would strip a class added here and, with it,
 * the transition mid-flight. An attribute the template doesn't bind is left alone.
 */
const PANEL_STATE = "data-cui-panel";
const isHidden = (el: Element) => el.getAttribute(PANEL_STATE) === "hidden";
/** Panels whose leave is under way, so an enter can tell a re-open from a fresh show. */
const leaving = new WeakSet<Element>();

/**
 * The `<Transition>` hooks every floating panel shares (#263): `v-bind` them, with the
 * panel rendered `v-if="present" v-show="open"` (composables/usePresence). The panel's
 * motion is one CSS transition on a state attribute (PANEL_STATE): entering sets it shown,
 * leaving sets it hidden, and `components-shared.css` animates the change. So a re-open
 * mid-exit just sets it shown again and the transition reverses from wherever the
 * panel is. (Vue's CSS mode re-applies `enter-from` there, dipping the panel towards
 * invisible for a frame before it turns back.)
 */
export const panelTransition = {
  css: false,
  onBeforeEnter(el: Element) {
    // Re-opened mid-exit: it is still on screen, mid-transition, and reverses from there.
    // Nothing here may read its style: cancelling the leave sets `display: none` for an
    // instant, and a style read then would stop the transition it is to reverse.
    if (leaving.delete(el)) return;
    el.setAttribute(PANEL_STATE, "hidden");
  },
  onEnter(el: Element, done: () => void) {
    // Style the hidden state before it is lifted, or there is nothing to transition from.
    if (isHidden(el)) void (el as HTMLElement).offsetWidth;
    el.setAttribute(PANEL_STATE, "shown");
    afterAnimations(el, done);
  },
  onLeave(el: Element, done: () => void) {
    leaving.add(el);
    el.setAttribute(PANEL_STATE, "hidden");
    afterAnimations(el, () => {
      leaving.delete(el);
      done();
    });
  },
};

/**
 * The `<Transition>` for an element whose exit runs on its own state classes and those of
 * the descendants it marks `data-cui-exit` (CuiModal, CuiSlideover, CuiAlert): `v-bind` it,
 * and the leave waits for that exit (afterAnimations).
 */
export const subtreeTransition = { css: false, onLeave: afterAnimations };

