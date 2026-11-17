import { describe, expect, it } from "vitest";
import router from "../../router";
import { PAGES } from "../pages";

// Documentation pages are the router's concrete, non-redirect routes; the catch-all and
// redirects are not pages.
const routePaths = router
  .getRoutes()
  .filter((route) => !route.redirect && !route.path.includes(":"))
  .map((route) => route.path);

describe("the page index", () => {
  it("has an entry for every documentation route", () => {
    const indexed = new Set(PAGES.map((p) => p.path));
    expect(routePaths.filter((path) => !indexed.has(path))).toEqual([]);
  });

  it("lists no page the router cannot open", () => {
    const routes = new Set(routePaths);
    expect(PAGES.filter((p) => !routes.has(p.path)).map((p) => p.path)).toEqual([]);
  });

  it("has unique ids and paths", () => {
    expect(new Set(PAGES.map((p) => p.id)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((p) => p.path)).size).toBe(PAGES.length);
  });

  it("gives every page at least one keyword", () => {
    expect(PAGES.filter((p) => p.keywords.length === 0).map((p) => p.id)).toEqual([]);
  });
});
