import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { undo } from "@codemirror/commands";
import { createCleanUI, CuiConfigProvider, type DeepPartialMessages } from "@itguy614/clean-ui";
import CuiMarkdownEditor from "../../../../components/CuiMarkdownEditor.vue";
import { linkPlugin } from "../../link";
import { imagePlugin } from "../../image";

interface Exposed {
  getView: () => import("@codemirror/view").EditorView;
  runCommand: (id: string) => boolean;
}

function exposed(wrapper: VueWrapper): Exposed {
  return wrapper.vm as unknown as Exposed;
}

function flush() {
  return Promise.resolve().then(() => Promise.resolve());
}

// CuiInput declares `id` and binds it to the native <input> it renders, so the
// id resolves straight to the real control — see clean-ui#78.
function nativeInput(id: string): HTMLInputElement | null {
  return document.querySelector(`input#${id}`);
}

function setInputValue(id: string, value: string) {
  const input = nativeInput(id);
  if (!input) throw new Error(`no native input #${id}`);
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

function clickButtonWithText(text: string) {
  const button = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);
  if (!button) throw new Error(`no button with text "${text}"`);
  button.click();
}

let wrapper: VueWrapper | undefined;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  // mountStandaloneDialog appends outside the component tree — unmounting
  // the wrapper doesn't clean it up, so tests must.
  document.body.innerHTML = "";
});

async function openDialog(command: string, plugin: typeof linkPlugin, modelValue = "") {
  wrapper = mount(CuiMarkdownEditor, { props: { modelValue, plugins: [plugin] } });
  await nextTick();
  const view = exposed(wrapper).getView();
  const handled = exposed(wrapper).runCommand(command);
  await nextTick();
  return { view, handled };
}

// #222: one dialog, two configurations. Everything but the strings, the field ids and
// the markdown inserted is shared, so each case runs against both.
describe.each([
  {
    command: "link",
    plugin: linkPlugin,
    urlId: "cui-link-dialog-url",
    textId: "cui-link-dialog-label",
    title: "Insert link",
    labels: ["URL", "Text"],
    url: "https://example.com",
    text: "Example",
    inserted: "[Example](https://example.com)",
  },
  {
    command: "image",
    plugin: imagePlugin,
    urlId: "cui-image-dialog-url",
    textId: "cui-image-dialog-alt",
    title: "Insert image",
    labels: ["Image URL", "Alt text"],
    url: "https://example.com/pic.png",
    text: "A picture",
    inserted: "![A picture](https://example.com/pic.png)",
  },
])("the $command dialog", ({ command, plugin, urlId, textId, title, labels, url, text, inserted }) => {
  it("opens without editing, and submitting inserts the markdown as one undo step", async () => {
    const { view, handled } = await openDialog(command, plugin);
    expect(handled).toBe(true);
    expect(document.body.textContent).toContain(title);
    // The command returned synchronously without editing yet (FR18).
    expect(view.state.doc.toString()).toBe("");

    setInputValue(urlId, url);
    setInputValue(textId, text);
    clickButtonWithText("Insert");
    await flush();

    expect(view.state.doc.toString()).toBe(inserted);
    undo(view);
    expect(view.state.doc.toString()).toBe("");
  });

  it("labels both fields through CuiFormField, alike", async () => {
    await openDialog(command, plugin);
    // Both labels are CuiFormField's and name their own input — the two dialogs this
    // replaced styled only the first one (`cui-lead`) and hand-rolled the markup.
    for (const [id, label] of [
      [urlId, labels[0]],
      [textId, labels[1]],
    ]) {
      const el = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
      expect(el?.classList.contains("cui-form-field__label")).toBe(true);
      expect(el?.textContent?.trim()).toBe(label);
      expect(nativeInput(id)!.getAttribute("aria-labelledby")).toBe(el!.id);
    }
    expect(document.querySelector(".cui-lead")).toBeNull();
  });

  it("focuses the URL field, not the modal's own root", async () => {
    // Regression test (UX review): focus previously landed on the modal
    // root, costing a keyboard user two Tab presses (past the header's
    // close button) to reach the field they almost always want to type
    // into first.
    await openDialog(command, plugin);
    await flush();
    expect(document.activeElement).toBe(nativeInput(urlId));
  });

  it("cancelling leaves the document untouched and unmounts the dialog", async () => {
    const { view } = await openDialog(command, plugin, "unchanged");
    setInputValue(urlId, url);
    clickButtonWithText("Cancel");
    await flush();

    expect(view.state.doc.toString()).toBe("unchanged");
    expect(nativeInput(urlId)).toBeNull();
  });

  it("refuses an empty URL with an inline error", async () => {
    const { view } = await openDialog(command, plugin);
    clickButtonWithText("Insert");
    await nextTick();

    expect(nativeInput(urlId)).not.toBeNull();
    expect(view.state.doc.toString()).toBe("");
    expect(document.body.textContent).toContain("A URL is required.");
    expect(nativeInput(urlId)!.getAttribute("aria-invalid")).toBe("true");
  });

  it("clears the URL error once the URL is edited", async () => {
    await openDialog(command, plugin);
    clickButtonWithText("Insert");
    await nextTick();
    expect(nativeInput(urlId)!.getAttribute("aria-invalid")).toBe("true");

    setInputValue(urlId, url);
    await nextTick();
    expect(nativeInput(urlId)!.hasAttribute("aria-invalid")).toBe(false);
    expect(document.body.textContent).not.toContain("A URL is required.");
  });

  it("ignores an Enter that confirms an IME composition", async () => {
    const { view } = await openDialog(command, plugin);
    setInputValue(urlId, url);
    nativeInput(textId)!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }));
    await flush();
    expect(view.state.doc.toString()).toBe("");
    expect(nativeInput(urlId)).not.toBeNull();
  });

  it("refuses a javascript: URL with an inline error and inserts nothing", async () => {
    const { view } = await openDialog(command, plugin);
    setInputValue(urlId, "javascript:alert(1)");
    clickButtonWithText("Insert");
    await nextTick();

    // Dialog stays open (rejected client-side) — nothing was inserted.
    expect(nativeInput(urlId)).not.toBeNull();
    expect(view.state.doc.toString()).toBe("");
    expect(document.body.textContent).toContain("scheme isn't allowed");
  });

  it("disables mode switching while open, and re-enables it after closing", async () => {
    const toggle = () => wrapper!.find('[data-testid="cui-markdown-editor-mode-toggle"]');
    await openDialog(command, plugin);
    expect(toggle().attributes("disabled")).toBeDefined();

    clickButtonWithText("Cancel");
    await flush();
    await nextTick();
    expect(toggle().attributes("disabled")).toBeUndefined();
  });
});

describe("the link dialog's initial values", () => {
  it("a URL-looking selection pre-fills the URL field; any other selection becomes the text", async () => {
    const { view } = await openDialog("link", linkPlugin, "https://example.com and some words");
    clickButtonWithText("Cancel");
    await flush();

    view.dispatch({ selection: { anchor: 0, head: "https://example.com".length } });
    exposed(wrapper!).runCommand("link");
    await nextTick();
    expect(nativeInput("cui-link-dialog-url")!.value).toBe("https://example.com");
    expect(nativeInput("cui-link-dialog-label")!.value).toBe("");
    clickButtonWithText("Cancel");
    await flush();

    view.dispatch({ selection: { anchor: "https://example.com and ".length, head: "https://example.com and some".length } });
    exposed(wrapper!).runCommand("link");
    await nextTick();
    expect(nativeInput("cui-link-dialog-url")!.value).toBe("");
    expect(nativeInput("cui-link-dialog-label")!.value).toBe("some");
  });

  it("a link submitted with no text shows its URL", async () => {
    const { view } = await openDialog("link", linkPlugin);
    setInputValue("cui-link-dialog-url", "https://example.com");
    clickButtonWithText("Insert");
    await flush();
    expect(view.state.doc.toString()).toBe("[https://example.com](https://example.com)");
  });
});

// #326: the dialog is a detached app, so it can't inject the host's clean-ui config itself.
describe("the dialog follows the host's clean-ui config", () => {
  it("takes the app's heading level and a provider's clean-ui messages", async () => {
    const Host = defineComponent(() => () =>
      h(CuiConfigProvider, { messages: { close: "Fermer" } }, () =>
        h(CuiMarkdownEditor, { modelValue: "", plugins: [linkPlugin] }),
      ),
    );
    wrapper = mount(Host, { global: { plugins: [createCleanUI({ headingLevels: { modalHeader: "h3" } })] } });
    await nextTick();
    exposed(wrapper.findComponent(CuiMarkdownEditor) as VueWrapper).runCommand("link");
    await nextTick();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.querySelector("h3")?.textContent?.trim()).toBe("Insert link");
    expect(dialog?.querySelector("h2")).toBeNull();
    expect(dialog?.querySelector('button[aria-label="Fermer"]')).not.toBeNull();
  });

  it("follows a locale change made while it is open, its own strings and clean-ui's alike", async () => {
    const messages = ref<DeepPartialMessages>({ close: "Fermer", markdownEditor: { linkDialogTitle: "Insérer un lien" } });
    const Host = defineComponent(() => () =>
      h(CuiConfigProvider, { messages: messages.value }, () => h(CuiMarkdownEditor, { modelValue: "", plugins: [linkPlugin] })),
    );
    wrapper = mount(Host);
    await nextTick();
    exposed(wrapper.findComponent(CuiMarkdownEditor) as VueWrapper).runCommand("link");
    await nextTick();
    const dialog = () => document.querySelector('[role="dialog"]')!;
    expect(dialog().textContent).toContain("Insérer un lien");

    messages.value = { close: "Cerrar", markdownEditor: { linkDialogTitle: "Insertar enlace" } };
    await nextTick();
    expect(dialog().textContent).toContain("Insertar enlace");
    expect(dialog().querySelector('button[aria-label="Cerrar"]')).not.toBeNull();
  });

  it("falls back to the library's defaults with no host config", async () => {
    await openDialog("link", linkPlugin);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.querySelector("h2")?.textContent?.trim()).toBe("Insert link");
    expect(dialog?.querySelector('button[aria-label="Close"]')).not.toBeNull();
  });
});
