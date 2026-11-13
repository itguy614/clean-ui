import { createApp } from "vue";
import { createCleanUI, restoreColorMode, restoreDensity, restoreTheme } from "@itguy614/clean-ui";
// This site is the unbounded case the opt-in exists for: it renders a gallery of
// arbitrary Phosphor names to show what's available, so it accepts the full icon
// package. An app should instead register the handful of icons it uses — see the
// "Tree-shaking" section on the Icons page.
import "@itguy614/clean-ui/icons/lazy";
import router from "./router";
import App from "./App.vue";
import "./styles/main.css";
// The theme switcher offers all eight, and seven palettes are opt-in stylesheets (#220): a
// consumer imports `@itguy614/clean-ui/themes/<name>.css` per theme they use, or the one
// all-in-one `@itguy614/clean-ui/styles/all.css`. The docs load every theme from workspace
// source, by glob, so a theme added to the library appears here without an edit.
import.meta.glob("../../../packages/clean-ui/src/styles/themes/*.css", { eager: true });

// Importing the library no longer applies the stored theme, density or color mode (#209, #463, #487): apply
// them before anything renders.
restoreTheme();
restoreDensity();
restoreColorMode();

const app = createApp(App);
app.use(router);
app.use(createCleanUI());
app.mount("#app");
