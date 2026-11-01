import { createApp } from "vue";
import RenderApp from "./RenderApp.vue";

// The `/render` subpath's budget scenario (#226): markdown to HTML with no editor, which must
// cost the parser and serializer only. A CodeMirror module leaking back in (#225) blows the budget.
createApp(RenderApp).mount("#app");
