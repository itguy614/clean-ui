// Stand-ins for @itguy614/clean-ui-editor and its /render subpath during the editor's baseline
// size measurement (see baseline-stub.ts for the method). Same exports EditorApp.vue and
// RenderApp.vue use; each scenario only imports its own half.
import { defineComponent, h } from "vue";

export const CuiMarkdownEditor = defineComponent({
  setup() {
    return () => h("textarea");
  },
});

export function createMarkdownRenderAdapter() {
  return (markdown: string) => markdown;
}

export const CuiMarkdownViewer = defineComponent({
  setup() {
    return () => h("div");
  },
});
