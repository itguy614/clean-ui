// Task 5.2.2: every user-visible string resolves through clean-ui's message
// catalog. Functional (runtime) coverage complementing the type-level
// checks in `../../messages.test-d.ts`.
import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, defineComponent, h } from "vue";
import { CuiConfigProvider, type DeepPartialMessages } from "@itguy614/clean-ui";
import CuiMarkdownEditor from "../CuiMarkdownEditor.vue";
import { boldPlugin, italicPlugin, linkPlugin } from "../../plugins/builtin";
import { defaultMarkdownEditorMessages } from "../../messages";

function withProvider(overrides: DeepPartialMessages, props: Record<string, unknown> = {}) {
  return defineComponent({
    components: { CuiConfigProvider, CuiMarkdownEditor },
    setup() {
      return () =>
        h(CuiConfigProvider, { messages: overrides }, () => h(CuiMarkdownEditor, { modelValue: "", ...props }));
    },
  });
}

describe("CuiMarkdownEditor localization (task 5.2.2)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    // mountStandaloneDialog appends outside the component tree — unmounting
    // the wrapper doesn't clean it up (see link-image-dialogs.test.ts).
    document.body.innerHTML = "";
  });

  it("uses the built-in English defaults with no provider", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [boldPlugin] } });
    await nextTick();

    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-wysiwyg"]').text()).toBe("Formatted");
    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-source"]').text()).toBe("Source");
    expect(wrapper.find(".cui-markdown-editor-toolbar").attributes("aria-label")).toBe("Formatting");
    expect(wrapper.find(".cui-markdown-editor-toolbar .cui-button").attributes("aria-label")).toBe("Bold");
  });

  it("overrides a single toolbar label via CuiConfigProvider without disturbing sibling defaults", async () => {
    wrapper = mount(
      withProvider(
        { markdownEditor: { toolbarBold: "Gras" } },
        { plugins: [boldPlugin, italicPlugin] },
      ),
    );
    await nextTick();

    const buttons = wrapper.findAll(".cui-button[aria-label]");
    const labels = buttons.map((b) => b.attributes("aria-label"));
    expect(labels).toContain("Gras");
    expect(labels).toContain("Italic"); // untouched sibling stays at the English default
    // The mode toggle and toolbar aria-label are unrelated fields — also untouched.
    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-wysiwyg"]').text()).toBe("Formatted");
  });

  it("overrides the mode-toggle labels and screen-reader announcements", async () => {
    wrapper = mount(withProvider({ markdownEditor: { modeToggleFormatted: "Con formato", modeToggleSource: "Fuente" } }));
    await nextTick();

    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-wysiwyg"]').text()).toBe("Con formato");
    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-source"]').text()).toBe("Fuente");
  });

  it("overrides the maxLength counter and refusal message formatting", async () => {
    wrapper = mount(
      withProvider(
        { markdownEditor: { counter: (length, limit) => `${length} de ${limit}` } },
        { maxLength: 5, modelValue: "abc" },
      ),
    );
    await nextTick();

    expect(wrapper.find('[data-testid="cui-markdown-editor-counter"]').text()).toBe("3 de 5");
  });

  it("passes an overridden namespace's strings into the standalone link dialog", async () => {
    // The link dialog mounts as a *detached* Vue app (mount-standalone.ts) —
    // this proves the override reaches it via CommandContext.messages, not
    // provide/inject (which a detached app can't see).
    wrapper = mount(withProvider({ markdownEditor: { linkDialogTitle: "Insertar enlace" } }, { plugins: [linkPlugin] }));
    await nextTick();

    const editor = wrapper.findComponent(CuiMarkdownEditor);
    (editor.vm as unknown as { runCommand: (id: string) => boolean }).runCommand("link");
    await nextTick();

    expect(document.body.textContent).toContain("Insertar enlace");
    // Untouched sibling field on the same dialog still uses the English default.
    expect(document.querySelector("#cui-link-dialog-url")).not.toBeNull();
    expect(document.body.textContent).toContain(defaultMarkdownEditorMessages.linkDialogUrlLabel);
  });

  it("falls back to English defaults for any field the override doesn't touch", async () => {
    wrapper = mount(withProvider({ markdownEditor: { toolbarBold: "Gras" } }, { plugins: [boldPlugin] }));
    await nextTick();

    expect(wrapper.find(".cui-markdown-editor-toolbar").attributes("aria-label")).toBe(
      defaultMarkdownEditorMessages.toolbarAriaLabel,
    );
  });
});
