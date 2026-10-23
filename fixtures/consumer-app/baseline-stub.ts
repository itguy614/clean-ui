// Stand-in for @itguy614/clean-ui, used only when measuring the size budget's
// baseline (scripts/check-bundle-budget.mjs, CUI_BUNDLE_BASELINE=1 via
// vite.config.ts's alias). Same exports App.vue and GridApp.vue use, so the *same* source
// builds against "no clean-ui" without a second fixture app — the gzip
// difference between the two builds is clean-ui's real cost to this app.
import { defineComponent, h } from "vue";

export const CuiButton = defineComponent({
  setup(_props, { slots }) {
    return () => h("button", slots.default?.());
  },
});

export const CuiIcon = defineComponent({
  setup() {
    return () => null;
  },
});

export function useTheme() {
  return { theme: { value: "mono" }, setTheme() {} };
}

export const version = "0.0.0-baseline";

// The grid scenario's components (#377): GridApp.vue.
const passthrough = defineComponent({
  setup(_props, { slots }) {
    return () => h("div", slots.default?.());
  },
});
export const CuiDataGrid = passthrough;
export const CuiModal = passthrough;
export const CuiSlideover = passthrough;
export const CuiToastProvider = passthrough;
