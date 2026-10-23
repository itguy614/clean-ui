import { createApp } from "vue";
import GridApp from "./GridApp.vue";
import "@itguy614/clean-ui/styles";

// The size budget's second scenario (#377): a data grid with a modal, a slideover and
// toasts, the shape of a real admin page, so growth in those paths shows up per release.
createApp(GridApp).mount("#app");
