import { createApp } from "vue";
import ThemesApp from "./ThemesApp.vue";
import "@itguy614/clean-ui/styles";
// Two of the seven opt-in theme stylesheets (#220), through their explicit `exports` entries
// from the packed tarball. Not budgeted: it exists so scripts/check-fixture-guarantees.mjs
// can tell that exactly these two reach the build, and the other five do not.
import "@itguy614/clean-ui/themes/forest.css";
import "@itguy614/clean-ui/themes/ruby.css";

createApp(ThemesApp).mount("#app");
