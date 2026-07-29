// Stand-in for @itguy614/clean-ui, used only when measuring the size budget's
// baseline (scripts/check-bundle-budget.mjs, CUI_BUNDLE_BASELINE=1 via
// vite.config.ts's alias). Same exports App.vue uses, so the *same* source
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
