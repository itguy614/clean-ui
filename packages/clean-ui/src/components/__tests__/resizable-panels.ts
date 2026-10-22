import { mount } from "@vue/test-utils";
import CuiResizablePanels from "../CuiResizablePanels.vue";

/** A 400×200 container: minFirst/minSecond 100px are 25% each side by side. */
export function mountPanels(props: Record<string, unknown> = {}) {
  const w = mount(CuiResizablePanels, { props, attachTo: document.body });
  const container = w.find(".cui-resizable-panels").element as HTMLElement;
  container.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 400, height: 200, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return w;
}
