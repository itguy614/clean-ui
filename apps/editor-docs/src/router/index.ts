import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: "/", name: "overview", component: () => import("../pages/Overview.vue") },
    { path: "/installation", name: "installation", component: () => import("../pages/InstallationPage.vue") },
    { path: "/editor", name: "editor", component: () => import("../pages/EditorPage.vue") },
    { path: "/guides/plugins", name: "plugins", component: () => import("../pages/PluginAuthoringPage.vue") },
    { path: "/guides/integration", name: "integration", component: () => import("../pages/IntegrationTestingPage.vue") },
    { path: "/guides/accessibility", name: "accessibility", component: () => import("../pages/AccessibilityPage.vue") },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

export default router;
