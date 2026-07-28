import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { lockBodyScroll, unlockBodyScroll, isBodyScrollLocked } from "../scrollLock";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function setPlatform(userAgent: string, maxTouchPoints = 0) {
  Object.defineProperty(navigator, "userAgent", { value: userAgent, configurable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: maxTouchPoints, configurable: true });
}

/** jsdom has no layout: fake a document that is scrolled with a classic scrollbar. */
function fakeViewport({ scrollY = 0, scrollbar = 0 } = {}) {
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true, writable: true });
  Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: 1000 - scrollbar,
    configurable: true,
  });
}

beforeEach(() => {
  setPlatform(DESKTOP_UA);
  fakeViewport();
  document.body.style.cssText = "";
});

afterEach(() => {
  // drain any lock left by a failing assertion
  while (isBodyScrollLocked()) unlockBodyScroll();
  document.body.style.cssText = "";
  vi.restoreAllMocks();
});

describe("scroll lock — non-iOS", () => {
  it("hides body overflow and restores it", () => {
    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
  });

  it("does not pin the body", () => {
    lockBodyScroll();
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    unlockBodyScroll();
  });

  it("restores a pre-existing inline overflow rather than blanking it", () => {
    document.body.style.overflow = "scroll";
    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("holds the scrollbar's width so the page doesn't shift", () => {
    fakeViewport({ scrollbar: 15 });
    lockBodyScroll();
    expect(document.body.style.paddingRight).toBe("15px");
    unlockBodyScroll();
    expect(document.body.style.paddingRight).toBe("");
  });

  it("adds the scrollbar width on top of existing padding", () => {
    fakeViewport({ scrollbar: 15 });
    document.body.style.paddingRight = "8px";
    lockBodyScroll();
    expect(document.body.style.paddingRight).toBe("23px");
    unlockBodyScroll();
    expect(document.body.style.paddingRight).toBe("8px");
  });

  it("skips compensation when scrollbars are overlays", () => {
    fakeViewport({ scrollbar: 0 });
    lockBodyScroll();
    expect(document.body.style.paddingRight).toBe("");
    unlockBodyScroll();
  });
});

describe("scroll lock — iOS", () => {
  it("pins the body at its current offset on iPhone", () => {
    setPlatform(IPHONE_UA);
    fakeViewport({ scrollY: 420 });

    lockBodyScroll();
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-420px");
    expect(document.body.style.width).toBe("100%");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("detects iPadOS, which reports a Mac UA with touch points", () => {
    setPlatform(IPAD_UA, 5);
    lockBodyScroll();
    expect(document.body.style.position).toBe("fixed");
    unlockBodyScroll();
  });

  it("treats a touchless Mac as desktop", () => {
    setPlatform(IPAD_UA, 0);
    lockBodyScroll();
    expect(document.body.style.position).toBe("");
    unlockBodyScroll();
  });

  it("restores the scroll position on unlock", () => {
    setPlatform(IPHONE_UA);
    fakeViewport({ scrollY: 420 });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    lockBodyScroll();
    unlockBodyScroll();

    expect(scrollTo).toHaveBeenCalledWith(0, 420);
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
  });

  it("suppresses smooth scrolling for the restore jump", () => {
    setPlatform(IPHONE_UA);
    fakeViewport({ scrollY: 200 });
    document.documentElement.style.scrollBehavior = "smooth";
    let behaviorDuringRestore = "";
    vi.spyOn(window, "scrollTo").mockImplementation(() => {
      behaviorDuringRestore = document.documentElement.style.scrollBehavior;
    });

    lockBodyScroll();
    unlockBodyScroll();

    expect(behaviorDuringRestore).toBe("auto");
    expect(document.documentElement.style.scrollBehavior).toBe("smooth");
    document.documentElement.style.scrollBehavior = "";
  });
});

describe("scroll lock — reference counting", () => {
  it("stays locked until the last holder releases", () => {
    lockBodyScroll();
    lockBodyScroll();
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    expect(isBodyScrollLocked()).toBe(true);

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
    expect(isBodyScrollLocked()).toBe(false);
  });

  it("captures the scroll offset once, at the outermost lock", () => {
    setPlatform(IPHONE_UA);
    fakeViewport({ scrollY: 300 });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    lockBodyScroll();
    // A second overlay opening after the body is pinned would read scrollY 0
    fakeViewport({ scrollY: 0 });
    lockBodyScroll();
    unlockBodyScroll();
    unlockBodyScroll();

    expect(scrollTo).toHaveBeenCalledWith(0, 300);
  });

  it("ignores an unbalanced unlock", () => {
    unlockBodyScroll();
    expect(isBodyScrollLocked()).toBe(false);

    lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe("");
  });
});
