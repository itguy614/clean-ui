import { describe, it, expect, afterEach } from "vitest";
import { createApp, defineComponent, h, nextTick } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import CuiCardHeader from "../../components/CuiCardHeader.vue";
import CuiEmptyState from "../../components/CuiEmptyState.vue";
import CuiModal from "../../components/CuiModal.vue";
import CuiAlert from "../../components/CuiAlert.vue";
import CuiConfigProvider from "../../components/CuiConfigProvider.vue";
import { configureCleanUI, __clearHeadingLevels } from "../configure";
import { resolveRoleIcon, __clearRoleIcons } from "../colorIconMap";
import { createCleanUI } from "../../index";

/**
 * #149 — what an application decides once, it sets once: one registry, `configureCleanUI`,
 * also taken by `createCleanUI()`. A component's own prop still wins.
 */
afterEach(() => {
  __clearHeadingLevels();
  __clearRoleIcons();
  document.body.innerHTML = "";
});

const cardTag = (w: { find: (s: string) => { element: Element } }) => w.find(".cui-card-header__title").element.tagName;

describe("configureCleanUI: the global fallback", () => {
  it("falls back to the library's levels with nothing configured", () => {
    expect(cardTag(mount(CuiCardHeader, { props: { title: "T" } }))).toBe("H3");
  });

  it("sets a component's default, which its own titleAs still overrides", () => {
    configureCleanUI({ headingLevels: { cardHeader: "h2" } });
    expect(cardTag(mount(CuiCardHeader, { props: { title: "T" } }))).toBe("H2");
    expect(cardTag(mount(CuiCardHeader, { props: { title: "T", titleAs: "h4" } }))).toBe("H4");
    // Other components keep theirs.
    expect(mount(CuiEmptyState, { props: { title: "T" } }).find(".cui-empty-state__title").element.tagName).toBe("H3");
  });

  it("re-renders a mounted component when called after mount", async () => {
    const w = mount(CuiEmptyState, { props: { title: "T" } });
    configureCleanUI({ headingLevels: { emptyState: "h4" } });
    await nextTick();
    expect(w.find(".cui-empty-state__title").element.tagName).toBe("H4");
  });

  it("reaches the header CuiModal renders in simple mode, through modalHeader", async () => {
    configureCleanUI({ headingLevels: { modalHeader: "h3" } });
    mount(CuiModal, { props: { visible: true, title: "T" } });
    await flushPromises();
    expect(document.body.querySelector(".cui-modal-header__title")?.tagName).toBe("H3");
  });

  it("merges each call into the last, and roleIcons is registerRoleIcons", () => {
    configureCleanUI({ headingLevels: { cardHeader: "h2" } });
    configureCleanUI({ headingLevels: { emptyState: "h4" }, roleIcons: { error: "x-circle" } });
    expect(cardTag(mount(CuiCardHeader, { props: { title: "T" } }))).toBe("H2");
    expect(resolveRoleIcon(undefined, "error")).toEqual({ name: "x-circle", text: null });
  });
});

describe("per app: createCleanUI options", () => {
  function mountInApp(options: Parameters<typeof createCleanUI>[0], render: () => ReturnType<typeof h>) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const app = createApp(defineComponent({ render }));
    app.use(createCleanUI(options));
    app.mount(el);
    return { el, app };
  }

  it("belong to that app alone, and override the global fallback", () => {
    configureCleanUI({ headingLevels: { cardHeader: "h5" } });
    const a = mountInApp({ headingLevels: { cardHeader: "h2" } }, () => h(CuiCardHeader, { title: "A" }));
    const b = mountInApp({}, () => h(CuiCardHeader, { title: "B" }));
    expect(a.el.querySelector(".cui-card-header__title")?.tagName).toBe("H2");
    expect(b.el.querySelector(".cui-card-header__title")?.tagName).toBe("H5"); // the global, not app A's
    a.app.unmount();
    b.app.unmount();
  });

  it("set role icons for that app", () => {
    const a = mountInApp({ roleIcons: { error: "x-circle" } }, () => h(CuiAlert, { color: "error", title: "T" }));
    const b = mountInApp({}, () => h(CuiAlert, { color: "error", title: "T" }));
    expect(a.el.innerHTML).not.toBe(b.el.innerHTML);
    a.app.unmount();
    b.app.unmount();
  });
});

describe("per subtree: CuiConfigProvider", () => {
  it("overrides the app's defaults for what it wraps, and nests", () => {
    const w = mount(defineComponent({
      render: () =>
        h(CuiConfigProvider, { headingLevels: { cardHeader: "h4" } }, () => [
          h(CuiCardHeader, { title: "outer" }),
          h(CuiConfigProvider, { headingLevels: { emptyState: "h5" } }, () => [
            h(CuiCardHeader, { title: "inner" }),
            h(CuiEmptyState, { title: "empty" }),
          ]),
        ]),
    }));
    const tags = w.findAll(".cui-card-header__title").map((t) => t.element.tagName);
    expect(tags).toEqual(["H4", "H4"]); // the inner provider inherits the outer's cardHeader
    expect(w.find(".cui-empty-state__title").element.tagName).toBe("H5");
  });
});
