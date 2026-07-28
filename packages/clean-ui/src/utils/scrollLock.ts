/**
 * Body scroll lock for overlays.
 *
 * `overflow: hidden` on <body> is enough on desktop and Android, but iOS Safari
 * ignores it for touch scrolling — the page keeps panning behind an open modal.
 * The reliable fix there is pinning the body with `position: fixed` at its
 * current offset and restoring the scroll position on unlock, which we apply
 * only on iOS: it's more invasive (the document is briefly out of flow, and the
 * scroll position round-trips through JS), so platforms that honor
 * `overflow: hidden` shouldn't pay for it.
 *
 * Locks are reference-counted. Stacked overlays each lock and unlock, and the
 * document is only restored — and the scroll offset only captured — at the
 * outermost boundary.
 */

interface SavedState {
  overflow: string;
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  paddingRight: string;
  scrollY: number;
  pinned: boolean;
}

let lockCount = 0;
let saved: SavedState | null = null;

/**
 * iOS Safari, including iPadOS — which reports a Mac user agent and is only
 * distinguishable by its touch points. Feature detection can't identify this
 * behavior, so a narrow UA check is the pragmatic option.
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/.test(ua)) return true;
  return /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
}

/** Width of the classic (space-consuming) scrollbar, 0 for overlay scrollbars. */
function scrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth;
}

/** Lock body scrolling. Safe to call repeatedly — the lock is counted. */
export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;

  lockCount += 1;
  if (lockCount > 1) return;

  const body = document.body;
  const pinned = isIOS();
  const scrollY = window.scrollY;

  saved = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    paddingRight: body.style.paddingRight,
    scrollY,
    pinned,
  };

  // Removing the scrollbar reflows the page; hold its width so content
  // underneath doesn't jump sideways as the overlay opens.
  const gap = scrollbarWidth();
  if (gap > 0) {
    const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + gap}px`;
  }

  body.style.overflow = "hidden";

  if (pinned) {
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
  }
}

/** Release one lock. The document is restored when the last one is released. */
export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return;

  lockCount -= 1;
  if (lockCount > 0 || !saved) return;

  const body = document.body;
  const { scrollY, pinned } = saved;

  // Restore the exact previous inline values — blanking them would discard
  // styles the consumer set themselves.
  body.style.overflow = saved.overflow;
  body.style.position = saved.position;
  body.style.top = saved.top;
  body.style.left = saved.left;
  body.style.right = saved.right;
  body.style.width = saved.width;
  body.style.paddingRight = saved.paddingRight;
  saved = null;

  if (pinned) {
    // Un-pinning drops the document back to offset 0, so put it back. Suppress
    // `scroll-behavior: smooth` for the jump, or the restore animates.
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, scrollY);
    root.style.scrollBehavior = previousBehavior;
  }
}

/** Whether a lock is currently held (exposed for tests). */
export function isBodyScrollLocked(): boolean {
  return lockCount > 0;
}
