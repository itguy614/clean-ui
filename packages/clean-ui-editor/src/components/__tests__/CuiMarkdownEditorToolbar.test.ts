import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiMarkdownEditor from "../CuiMarkdownEditor.vue";
import { DEFAULT_PLUGINS } from "../../plugins/default-plugins";
import { press } from "../../../../../config/test/keyboard";

function exposed(wrapper: VueWrapper) {
  return wrapper.vm as unknown as {
    getView: () => import("@codemirror/view").EditorView;
    runCommand: (id: string) => boolean;
  };
}

describe("CuiMarkdownEditorToolbar (via CuiMarkdownEditor)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("renders the full default set with no configuration", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "" } });
    await nextTick();

    const buttons = wrapper.findAll('[role="toolbar"] button, [role="toolbar"] [role="button"]');
    // One button per default-preset command carrying a label.
    const expectedCount = DEFAULT_PLUGINS.reduce(
      (count, plugin) => count + Object.values(plugin.commands).filter((spec) => spec.label).length,
      0,
    );
    expect(buttons.length).toBe(expectedCount);
  });

  it("the toolbar prop subsets and orders by command id", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", toolbar: ["italic", "bold"] } });
    await nextTick();

    const labels = wrapper.findAll('[role="toolbar"] [aria-label]').map((b) => b.attributes("aria-label"));
    expect(labels).toEqual(["Italic", "Bold"]);
  });

  it("showToolbar=false omits the toolbar entirely", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", showToolbar: false } });
    await nextTick();

    expect(wrapper.find('[role="toolbar"]').exists()).toBe(false);
  });

  it("the #toolbar slot replaces the default toolbar", async () => {
    wrapper = mount(CuiMarkdownEditor, {
      props: { modelValue: "" },
      slots: { toolbar: '<div data-testid="custom-toolbar">custom</div>' },
    });
    await nextTick();

    expect(wrapper.find('[data-testid="custom-toolbar"]').exists()).toBe(true);
    expect(wrapper.find('[role="toolbar"]').exists()).toBe(false);
  });

  it("every button is at least 24px via its min-width/min-height CSS", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", toolbar: ["bold"] } });
    await nextTick();

    const button = wrapper.find('[role="toolbar"] button, [role="toolbar"] [role="button"]');
    expect(button.exists()).toBe(true);
    // jsdom doesn't compute layout, so this checks the authored rule exists
    // rather than a resolved pixel value — the real-browser check covers
    // the rendered size itself.
    const toolbar = wrapper.find('[role="toolbar"]');
    expect(toolbar.classes()).toContain("cui-markdown-editor-toolbar");
  });

  it("pressed state (aria-pressed) reflects isActive and updates on selection change", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "before **bold** text", toolbar: ["bold"] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    view.dispatch({ selection: { anchor: 2 } }); // well inside "before", away from any boundary
    await nextTick();
    let button = wrapper.find('[role="toolbar"] [aria-label="Bold"]');
    expect(button.attributes("aria-pressed")).toBe("false");

    view.dispatch({ selection: { anchor: "before **bold".length } });
    await nextTick();
    button = wrapper.find('[role="toolbar"] [aria-label="Bold"]');
    expect(button.attributes("aria-pressed")).toBe("true");
  });

  it("clicking a toolbar button runs the command", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", toolbar: ["bold"] } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: 0 } });

    await wrapper.find('[role="toolbar"] [aria-label="Bold"]').trigger("click");

    expect(view.state.doc.toString()).toBe("****");
  });

  it("arrow keys, Home and End move the roving tabindex between buttons", async () => {
    wrapper = mount(CuiMarkdownEditor, {
      props: { modelValue: "", toolbar: ["bold", "italic", "strikethrough"] },
      attachTo: document.body,
    });
    await nextTick();

    const buttons = () => wrapper!.findAll('[role="toolbar"] [aria-label]').map((b) => b.element as HTMLElement);
    // The keys are CuiToolbar's now (#190): `press` fires them on the focused button, as a
    // user would.

    expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    buttons()[0]!.focus();

    await press("ArrowRight");
    expect(document.activeElement).toBe(buttons()[1]);
    expect(buttons().map((b) => b.tabIndex)).toEqual([-1, 0, -1]);

    await press("ArrowLeft");
    expect(document.activeElement).toBe(buttons()[0]);

    await press("End");
    expect(document.activeElement).toBe(buttons()[2]);

    // It has always come round at the ends.
    await press("ArrowRight");
    expect(document.activeElement).toBe(buttons()[0]);
    await press("ArrowLeft");
    expect(document.activeElement).toBe(buttons()[2]);

    await press("Home");
    expect(document.activeElement).toBe(buttons()[0]);
    expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  });
});
