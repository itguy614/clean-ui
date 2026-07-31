import { createApp } from "vue";
import App from "./App.vue";
// Exercises the "./styles" export subpath and the #62 regression class
// (no base Tailwind utilities should ship in this stylesheet).
import "@itguy614/clean-ui/styles";

createApp(App).mount("#app");
