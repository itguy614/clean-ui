import { describe, it, expect, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CuiConfirmDialog from "../CuiConfirmDialog.vue";
import CuiButton from "../CuiButton.vue";
import CuiInput from "../CuiInput.vue";

// CuiConfirmDialog wraps CuiModal, which teleports content into <body> and opens
// on mount via an onMounted/nextTick flush — so await flushPromises() before
// querying. Query through the wrapper (it proxies the teleported tree).

function findButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const btn = wrapper
    .findAllComponents(CuiButton)
    .find((b) => b.text().includes(text));
  if (!btn) throw new Error(`No button with text "${text}"`);
  return btn;
}

describe("CuiConfirmDialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits confirm when the confirm button is clicked", async () => {
    const wrapper = mount(CuiConfirmDialog, {
      props: { visible: true, confirmText: "Delete" },
    });
    await flushPromises();
    await findButtonByText(wrapper, "Delete").trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);
    wrapper.unmount();
  });

  it("emits cancel and requests close when the cancel button is clicked", async () => {
    const wrapper = mount(CuiConfirmDialog, {
      props: { visible: true, cancelText: "Cancel" },
    });
    await flushPromises();
    await findButtonByText(wrapper, "Cancel").trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(1);
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it("disables confirm until the typed word matches confirmWord, then enables it", async () => {
    const wrapper = mount(CuiConfirmDialog, {
      props: { visible: true, confirmText: "Delete", confirmWord: "DELETE" },
    });
    await flushPromises();

    const confirmBtn = findButtonByText(wrapper, "Delete");
    // Disabled initially — no matching text typed.
    expect(confirmBtn.attributes("disabled")).toBeDefined();
    await confirmBtn.trigger("click");
    expect(wrapper.emitted("confirm")).toBeUndefined();

    // Type the matching word (case-insensitive, trimmed).
    await wrapper.findComponent(CuiInput).setValue("  delete  ");
    expect(confirmBtn.attributes("disabled")).toBeUndefined();
    await confirmBtn.trigger("click");
    expect(wrapper.emitted("confirm")).toHaveLength(1);
    wrapper.unmount();
  });

  it("does not render dialog content until v-model:visible is true", async () => {
    const wrapper = mount(CuiConfirmDialog, {
      props: { visible: false, confirmText: "Delete" },
    });
    await flushPromises();
    expect(wrapper.findAllComponents(CuiButton)).toHaveLength(0);

    await wrapper.setProps({ visible: true });
    await flushPromises();
    expect(wrapper.findAllComponents(CuiButton).length).toBeGreaterThan(0);
    wrapper.unmount();
  });
});
