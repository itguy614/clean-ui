import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { undo } from "@codemirror/commands";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { definePlugin } from "../define-plugin";
import type { CuiEditorPlugin } from "../types";

interface Exposed {
  getView: () => import("@codemirror/view").EditorView;
  runCommand: (id: string, ...args: unknown[]) => boolean;
  isCommandActive: (id: string) => boolean;
}

function exposed(wrapper: VueWrapper): Exposed {
  return wrapper.vm as unknown as Exposed;
}

const shoutPlugin = definePlugin({
  id: "shout",
  commands: {
    shout: {
      run: (context) => {
        context.insertAtCursor(context.doc.length === 0 ? "HELLO" : "!");
        return true;
      },
      label: "Shout",
    },
  },
  keymap: [{ key: "Mod-k", command: "shout" }],
});

const activeAwarePlugin = definePlugin({
  id: "toggle",
  commands: {
    toggle: {
      run: () => true,
      isActive: (context) => context.doc.includes("ACTIVE"),
    },
  },
});

const linkLikePlugin = definePlugin({
  id: "link-like",
  commands: {
    insertLink: {
      run: (context) => {
        // Mirrors FR14's shape: a command opens a "dialog" (here, a plain
        // callback standing in for whatever UI a real plugin renders),
        // and performs the edit only once collect() resolves.
        context
          .collect<{ url: string }>((settle) => settle.resolve({ url: "https://example.com" }))
          .then((values) => {
            if (values) context.insertAtCursor(`[label](${values.url})`);
          });
        return true;
      },
    },
  },
});

const throwingPlugin = definePlugin({
  id: "broken",
  commands: {
    explode: {
      run: () => {
        throw new Error("boom");
      },
      isActive: () => {
        throw new Error("boom-active");
      },
    },
  },
});

describe("plugin system integration", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("runCommand produces the same edit a direct invocation would", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [shoutPlugin] } });
    await nextTick();

    const ok = exposed(wrapper).runCommand("shout");

    expect(ok).toBe(true);
    expect(exposed(wrapper).getView().state.doc.toString()).toBe("HELLO");
  });

  it("a real keymap binding invokes the same command as runCommand", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [shoutPlugin] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "k", code: "KeyK", ctrlKey: true, bubbles: true }));

    expect(view.state.doc.toString()).toBe("HELLO");
  });

  it("isCommandActive reflects the command's isActive query", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "not yet", plugins: [activeAwarePlugin] } });
    await nextTick();

    expect(exposed(wrapper).isCommandActive("toggle")).toBe(false);

    exposed(wrapper).getView().dispatch({ changes: { from: 0, to: 0, insert: "ACTIVE " } });
    expect(exposed(wrapper).isCommandActive("toggle")).toBe(true);
  });

  it("a command with no isActive degrades to false rather than throwing", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [shoutPlugin] } });
    await nextTick();

    expect(() => exposed(wrapper!).isCommandActive("shout")).not.toThrow();
    expect(exposed(wrapper).isCommandActive("shout")).toBe(false);
  });

  it("a throwing command reports through pluginError and the editor stays usable", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "still here", plugins: [throwingPlugin] } });
    await nextTick();

    const ok = exposed(wrapper).runCommand("explode");

    expect(ok).toBe(false);
    expect(wrapper.emitted("pluginError")).toHaveLength(1);
    const [info] = wrapper.emitted("pluginError")![0] as [{ pluginId: string; commandId: string; error: unknown }];
    expect(info.pluginId).toBe("broken");
    expect(info.commandId).toBe("explode");
    expect((info.error as Error).message).toBe("boom");

    // The editor keeps working after the throw.
    expect(exposed(wrapper).getView().state.doc.toString()).toBe("still here");
    exposed(wrapper).runCommand("shout" as never); // unknown id, should just no-op
    exposed(wrapper).getView().dispatch({ changes: { from: 0, to: 0, insert: "x" } });
    expect(exposed(wrapper).getView().state.doc.toString()).toBe("xstill here");
  });

  it("a throwing isActive query degrades to false rather than throwing", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [throwingPlugin] } });
    await nextTick();

    let result: boolean | undefined;
    expect(() => {
      result = exposed(wrapper!).isCommandActive("explode");
    }).not.toThrow();
    expect(result).toBe(false);
    expect(wrapper.emitted("pluginError")).toHaveLength(1);
  });

  it("adding a plugin to a mounted editor updates commands with no loss of document, history or cursor", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "keep me", plugins: [] } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ changes: { from: 7, to: 7, insert: "!" }, selection: { anchor: 8 } });

    await wrapper.setProps({ plugins: [shoutPlugin] });
    await nextTick();

    // Same view, same document/history/cursor — no remount occurred.
    expect(exposed(wrapper).getView()).toBe(view);
    expect(view.state.doc.toString()).toBe("keep me!");
    expect(view.state.selection.main.head).toBe(8);
    expect(exposed(wrapper).runCommand("shout")).toBe(true);

    undo(view);
    expect(view.state.doc.toString()).toBe("keep me");
  });

  it("a collect-based command edits only after the seam resolves, and that edit is one undo step", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [linkLikePlugin] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    const ok = exposed(wrapper).runCommand("insertLink");
    expect(ok).toBe(true);
    // The command returned synchronously (FR18) before the async edit landed.
    expect(view.state.doc.toString()).toBe("");

    await Promise.resolve().then(() => Promise.resolve()); // flush the .then() continuation

    expect(view.state.doc.toString()).toBe("[label](https://example.com)");
    undo(view);
    expect(view.state.doc.toString()).toBe("");
  });

  it("an invalid plugin configuration (bad API version) keeps the previous one and reports the failure", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "unchanged", plugins: [shoutPlugin] } });
    await nextTick();

    const incompatible = { ...definePlugin({ id: "incompatible", commands: {} }), apiVersion: 999 } as CuiEditorPlugin;
    await wrapper.setProps({ plugins: [incompatible] });
    await nextTick();

    expect(wrapper.emitted("pluginConfigError")).toHaveLength(1);
    const [message] = wrapper.emitted("pluginConfigError")![0] as [string];
    expect(message).toContain("incompatible");
    expect(message).toContain("999");

    // The previous configuration (shoutPlugin) is still active.
    expect(exposed(wrapper).runCommand("shout")).toBe(true);
  });
});
