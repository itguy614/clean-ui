import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { undo } from "@codemirror/commands";
import CuiMarkdownEditor from "../../../components/CuiMarkdownEditor.vue";
import {
  boldPlugin,
  italicPlugin,
  strikethroughPlugin,
  inlineCodePlugin,
  heading1Plugin,
  heading2Plugin,
  bulletedListPlugin,
  numberedListPlugin,
  taskListPlugin,
  blockquotePlugin,
  codeFencePlugin,
  horizontalRulePlugin,
} from "..";
import type { CuiEditorPlugin } from "../../types";

interface Exposed {
  getView: () => import("@codemirror/view").EditorView;
  runCommand: (id: string, ...args: unknown[]) => boolean;
  isCommandActive: (id: string) => boolean;
}

function exposed(wrapper: VueWrapper): Exposed {
  return wrapper.vm as unknown as Exposed;
}

async function mountWith(doc: string, plugin: CuiEditorPlugin) {
  const wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, plugins: [plugin] } });
  await nextTick();
  return wrapper;
}

function select(wrapper: VueWrapper, anchor: number, head = anchor) {
  exposed(wrapper).getView().dispatch({ selection: { anchor, head } });
}

function docText(wrapper: VueWrapper): string {
  return exposed(wrapper).getView().state.doc.toString();
}

describe("built-in formatting plugins", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  describe.each([
    { plugin: boldPlugin, id: "bold", marker: "**" },
    { plugin: italicPlugin, id: "italic", marker: "*" },
    { plugin: strikethroughPlugin, id: "strikethrough", marker: "~~" },
    { plugin: inlineCodePlugin, id: "inlineCode", marker: "`" },
  ])("inline toggle: $id", ({ plugin, id, marker }) => {
    it("applies to an empty selection, placing the cursor between the markers (FR13)", async () => {
      wrapper = await mountWith("", plugin);
      select(wrapper, 0);

      exposed(wrapper).runCommand(id);

      expect(docText(wrapper)).toBe(`${marker}${marker}`);
      expect(exposed(wrapper).getView().state.selection.main.head).toBe(marker.length);
    });

    it("applies to a partial selection, wrapping it", async () => {
      wrapper = await mountWith("hello world", plugin);
      select(wrapper, 0, 5);

      exposed(wrapper).runCommand(id);

      expect(docText(wrapper)).toBe(`${marker}hello${marker} world`);
    });

    it("applies to a multi-line selection", async () => {
      wrapper = await mountWith("one\ntwo", plugin);
      select(wrapper, 0, 7);

      exposed(wrapper).runCommand(id);

      expect(docText(wrapper)).toBe(`${marker}one\ntwo${marker}`);
    });

    it("toggles off when the cursor is inside an already-formatted construct (FR12), and isActive reflects it", async () => {
      const doc = `before ${marker}word${marker} after`;
      wrapper = await mountWith(doc, plugin);
      select(wrapper, doc.indexOf("word") + 2);

      expect(exposed(wrapper).isCommandActive(id)).toBe(true);
      exposed(wrapper).runCommand(id);

      expect(docText(wrapper)).toBe("before word after");
    });

    it("isActive is false outside the construct", async () => {
      const doc = `${marker}word${marker} outside`;
      wrapper = await mountWith(doc, plugin);
      select(wrapper, doc.length - 3); // well inside "outside", away from any boundary

      expect(exposed(wrapper).isCommandActive(id)).toBe(false);
    });

    it("is one undo step", async () => {
      const original = "hello world";
      wrapper = await mountWith(original, plugin);
      select(wrapper, 0, 5);

      exposed(wrapper).runCommand(id);
      undo(exposed(wrapper).getView());

      expect(docText(wrapper)).toBe(original);
    });
  });

  describe("headings", () => {
    it("applies a heading prefix to the current line", async () => {
      wrapper = await mountWith("Title", heading1Plugin);
      select(wrapper, 2);

      exposed(wrapper).runCommand("heading1");

      expect(docText(wrapper)).toBe("# Title");
      expect(exposed(wrapper).isCommandActive("heading1")).toBe(true);
    });

    it("toggles off an existing same-level heading", async () => {
      wrapper = await mountWith("# Title", heading1Plugin);
      select(wrapper, 3);

      exposed(wrapper).runCommand("heading1");

      expect(docText(wrapper)).toBe("Title");
    });

    it("converts a different heading level rather than double-prefixing", async () => {
      const wrapper2 = mount(CuiMarkdownEditor, { props: { modelValue: "# Title", plugins: [heading1Plugin, heading2Plugin] } });
      await nextTick();
      wrapper = wrapper2;
      select(wrapper, 3);

      exposed(wrapper).runCommand("heading2");

      expect(docText(wrapper)).toBe("## Title");
      expect(exposed(wrapper).isCommandActive("heading1")).toBe(false);
      expect(exposed(wrapper).isCommandActive("heading2")).toBe(true);
    });
  });

  describe.each([
    { plugin: bulletedListPlugin, id: "bulletedList", prefix: "- " },
    { plugin: blockquotePlugin, id: "blockquote", prefix: "> " },
  ])("line-prefix toggle: $id", ({ plugin, id, prefix }) => {
    it("applies across a multi-line selection", async () => {
      wrapper = await mountWith("one\ntwo\nthree", plugin);
      select(wrapper, 0, "one\ntwo\nthree".length);

      exposed(wrapper).runCommand(id);

      expect(docText(wrapper)).toBe(`${prefix}one\n${prefix}two\n${prefix}three`);
    });

    it("toggles off when every selected line already has the prefix", async () => {
      const doc = `${prefix}one\n${prefix}two`;
      wrapper = await mountWith(doc, plugin);
      select(wrapper, 0, doc.length);

      exposed(wrapper).runCommand(id);

      expect(docText(wrapper)).toBe("one\ntwo");
    });

    it("is one undo step across multiple lines", async () => {
      const original = "one\ntwo\nthree";
      wrapper = await mountWith(original, plugin);
      select(wrapper, 0, original.length);

      exposed(wrapper).runCommand(id);
      undo(exposed(wrapper).getView());

      expect(docText(wrapper)).toBe(original);
    });
  });

  describe("numbered list", () => {
    it("numbers each selected line sequentially from 1", async () => {
      wrapper = await mountWith("one\ntwo\nthree", numberedListPlugin);
      select(wrapper, 0, "one\ntwo\nthree".length);

      exposed(wrapper).runCommand("numberedList");

      expect(docText(wrapper)).toBe("1. one\n2. two\n3. three");
    });

    it("toggles off existing numbering", async () => {
      const doc = "1. one\n2. two";
      wrapper = await mountWith(doc, numberedListPlugin);
      select(wrapper, 0, doc.length);

      exposed(wrapper).runCommand("numberedList");

      expect(docText(wrapper)).toBe("one\ntwo");
    });
  });

  describe("task list", () => {
    it("inserts unchecked task items", async () => {
      wrapper = await mountWith("buy milk", taskListPlugin);
      select(wrapper, 0);

      exposed(wrapper).runCommand("taskList");

      expect(docText(wrapper)).toBe("- [ ] buy milk");
    });

    it("toggles off regardless of checked state", async () => {
      wrapper = await mountWith("- [x] done\n- [ ] pending", taskListPlugin);
      select(wrapper, 0, "- [x] done\n- [ ] pending".length);

      exposed(wrapper).runCommand("taskList");

      expect(docText(wrapper)).toBe("done\npending");
    });
  });

  describe("code fence", () => {
    it("wraps an empty selection with a fence and places the cursor inside", async () => {
      wrapper = await mountWith("", codeFencePlugin);
      select(wrapper, 0);

      exposed(wrapper).runCommand("codeFence");

      expect(docText(wrapper)).toBe("```\n\n```");
      expect(exposed(wrapper).getView().state.selection.main.head).toBe(4);
    });

    it("wraps a selection and toggles off from inside it", async () => {
      wrapper = await mountWith("const x = 1;", codeFencePlugin);
      select(wrapper, 0, "const x = 1;".length);
      exposed(wrapper).runCommand("codeFence");
      expect(docText(wrapper)).toBe("```\nconst x = 1;\n```");

      select(wrapper, docText(wrapper).indexOf("const"));
      expect(exposed(wrapper).isCommandActive("codeFence")).toBe(true);
      exposed(wrapper).runCommand("codeFence");

      expect(docText(wrapper)).toBe("const x = 1;");
    });
  });

  describe("horizontal rule", () => {
    it("inserts a rule", async () => {
      wrapper = await mountWith("above\nbelow", horizontalRulePlugin);
      select(wrapper, "above".length);

      exposed(wrapper).runCommand("horizontalRule");

      expect(docText(wrapper)).toBe("above\n---\n\nbelow");
    });

    it("removes an existing rule line, and isActive reflects it", async () => {
      wrapper = await mountWith("above\n---\nbelow", horizontalRulePlugin);
      select(wrapper, "above\n--".length);

      expect(exposed(wrapper).isCommandActive("horizontalRule")).toBe(true);
      exposed(wrapper).runCommand("horizontalRule");

      expect(docText(wrapper)).toBe("above\nbelow");
    });
  });
});
