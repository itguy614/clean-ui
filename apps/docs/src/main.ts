import { createApp } from "vue";
import { createCleanUI } from "@itguy614/clean-ui";
// This site is the unbounded case the opt-in exists for: it renders a gallery of
// arbitrary Phosphor names to show what's available, so it accepts the full icon
// package. An app should instead register the handful of icons it uses — see the
// "Tree-shaking" section on the Icons page.
import "@itguy614/clean-ui/icons/lazy";
import router from "./router";
import App from "./App.vue";
import "./styles/main.css";

const app = createApp(App);
app.use(router);
app.use(createCleanUI());
app.mount("#app");
