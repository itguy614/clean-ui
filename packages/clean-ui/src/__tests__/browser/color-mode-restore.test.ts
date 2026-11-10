import { describe, it, expect, afterEach } from "vitest";
import { nextTick } from "vue";
import { useColorMode } from "../../composables/useColorMode";
import { ssrColorModeInitScript } from "../../ssr-color-mode-init";
import { COLOR_MODE_STORAGE_KEY, DARK_SCHEME_QUERY } from "../../ssr-constants";

/**
 * #487: a mode chosen through useColorMode() survives a reload with no flash. A reload is a
 * fresh document, so this loads one: an `srcdoc` iframe, which shares this page's origin and
 * so its localStorage, whose <head> holds only the init script. A second inline script, which
 * stands in for "the app mounts", records `<html>`'s class at that moment, so what is
 * asserted is the class the first paint would have had.
 */
function classBeforeMount(): Promise<string> {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.srcdoc = `<!doctype html><html><head><script>${ssrColorModeInitScript}</script></head><body>
      <script>document.body.setAttribute("data-seen", document.documentElement.className)</script></body></html>`;
    frame.addEventListener("load", () => {
      resolve(frame.contentDocument!.body.getAttribute("data-seen") ?? "missing");
      frame.remove();
    });
    document.body.append(frame);
  });
}

describe("colour mode restore (real browser)", () => {
  afterEach(() => {
    localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    document.documentElement.classList.remove("dark");
  });

  it("a mode chosen with setMode is restored by the init script before the app mounts", async () => {
    const { setMode } = useColorMode();
    setMode("dark");
    await nextTick();
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    expect(await classBeforeMount()).toBe("dark");

    setMode("light");
    await nextTick();
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("light");
    expect(await classBeforeMount()).toBe("");
  });

  it("system follows the browser's own preference, in the page and in a fresh document", async () => {
    const { setMode, isDark } = useColorMode();
    setMode("system");
    await nextTick();
    const os = window.matchMedia(DARK_SCHEME_QUERY).matches;
    expect(isDark.value).toBe(os);
    expect(document.documentElement.classList.contains("dark")).toBe(os);
    expect(await classBeforeMount()).toBe(os ? "dark" : "");
  });
});
