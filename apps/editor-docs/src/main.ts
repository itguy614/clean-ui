import { createApp } from "vue";
import { createCleanUI } from "@itguy614/clean-ui";
// Same exception the main docs site takes (see its Icons page): a docs
// site's own chrome renders whatever icon name this file picks, so it takes
// the full icon package rather than curating a list — the editor's own
// toolbar icons are separately registered by @itguy614/clean-ui-editor
// itself and don't need this at all.
import "@itguy614/clean-ui/icons/lazy";
import router from "./router";
import App from "./App.vue";
import "./styles/main.css";

const app = createApp(App);
app.use(router);
app.use(createCleanUI());
app.mount("#app");
