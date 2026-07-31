import { ref, onMounted, onUnmounted, type Ref } from "vue";

const DARK_CLASS = "dark";

function resolveIsDark(el: Element | null): boolean {
  let node: Element | null = el;
  while (node) {
    if (node.classList.contains(DARK_CLASS)) return true;
    node = node.parentElement;
  }
  return false;
}

// One shared MutationObserver for every active useColorScheme() call site,
// rather than one per component — a page with many dark-aware components
// (e.g. syntax-highlighted code blocks, the composable's whole use case)
// would otherwise register that many independent observers all watching the
// same document subtree. Mirrors the shared-listener pattern in useBreakpoint.ts.
const subscribers = new Set<() => void>();
let sharedObserver: MutationObserver | null = null;

function ensureObserver() {
  if (sharedObserver || typeof MutationObserver === "undefined") return;
  sharedObserver = new MutationObserver(() => {
    for (const notify of subscribers) notify();
  });
  // Observing document.documentElement with subtree:true is the only way to
  // catch a class change on an arbitrary ancestor — MutationObserver has no
  // "watch this node's ancestors" mode. Each subscriber's resync is a cheap,
  // idempotent ancestor walk, so broadcasting to all of them on any
  // document-wide class change is simpler than per-subscriber filtering.
  sharedObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  });
}

function releaseObserverIfIdle() {
  if (subscribers.size === 0 && sharedObserver) {
    sharedObserver.disconnect();
    sharedObserver = null;
  }
}

/**
 * Reactive dark-mode signal for one component's own ancestor chain.
 *
 * clean-ui's dark mode is a `.dark` class that can sit on any ancestor and can
 * be scoped to a subtree, so a single global boolean would be wrong — two
 * components in differently-themed subtrees can legitimately disagree. This
 * resolves per call site instead: pass the calling component's root template
 * ref and it walks upward from there.
 *
 * Consumers that need dark mode as a JS value rather than a CSS selector
 * (e.g. a syntax highlighter whose own theme is fixed at configuration time,
 * not read from the cascade) use this instead of hand-rolling a `.dark`
 * observer.
 */
export function useColorScheme(target: Ref<HTMLElement | null | undefined>) {
  const isDark = ref(false);

  function sync() {
    isDark.value = resolveIsDark(target.value ?? null);
  }

  onMounted(() => {
    // No DOM access before this point — onMounted never runs during SSR.
    sync();
    ensureObserver();
    subscribers.add(sync);
  });

  onUnmounted(() => {
    subscribers.delete(sync);
    releaseObserverIfIdle();
  });

  return { isDark };
}
