import { createApp } from "vue";
import EditorApp from "./EditorApp.vue";
import "@itguy614/clean-ui/styles";
import "@itguy614/clean-ui-editor/styles";

// The editor barrel's budget scenario (#226): the whole editor, CodeMirror included, imported
// statically so its full cost lands in the measured bundle.
createApp(EditorApp).mount("#app");
