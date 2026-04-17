import { createApp } from "vue";
import { createCleanUI } from "@itguy614/clean-ui";
import router from "./router";
import App from "./App.vue";
import "./styles/main.css";

const app = createApp(App);
app.use(router);
app.use(createCleanUI());
app.mount("#app");
