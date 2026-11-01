import { createApp } from "vue";
import RenderApp from "./RenderApp.vue";
// The viewer's own styles ship in this one stylesheet, so a render-only consumer loads it too.
import "@itguy614/clean-ui-editor/styles";

// The `/render` subpath's budget scenario (#226): markdown to HTML with no editor, which must
// cost the parser and serializer only. A CodeMirror module leaking back in (#225) blows the budget.
createApp(RenderApp).mount("#app");
