import { describe, it, expect, afterEach } from "vitest";
import { toRaw } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import CuiConfirmDialog from "../CuiConfirmDialog.vue";
import CuiModal from "../CuiModal.vue";
import CuiButton from "../CuiButton.vue";
import CuiInput from "../CuiInput.vue";
import CuiIcon from "../CuiIcon.vue";
import { PhRocket } from "@phosphor-icons/vue";
import { FALLBACK_ICON } from "../../icons/fallback";
import { IconInfo } from "../../icons/generated/info";
import { IconSealQuestion } from "../../icons/generated/seal-question";
import { IconWarning } from "../../icons/generated/warning";
import { IconWarningCircle } from "../../icons/generated/warning-circle";

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

  describe("variant, icon and confirmColor (#375)", () => {
    const VARIANTS = ["danger", "warning", "info", "primary"] as const;

    async function open(props: Record<string, unknown>) {
      const wrapper = mount(CuiConfirmDialog, {
        props: { visible: true, confirmText: "Go", ...props },
      });
      await flushPromises();
      return wrapper;
    }

    // The modal teleports into <body>: query the DOM for elements, the wrapper for components.
    function tile() {
      return document.querySelector<HTMLElement>(".cui-confirm-dialog__icon");
    }

    function tileIcon(wrapper: ReturnType<typeof mount>) {
      const icon = wrapper.findAllComponents(CuiIcon).find((i) => i.props("size") === "1.25rem");
      if (!icon) throw new Error("No tile icon");
      return icon;
    }

    // The default (no variant) and the three pre-#375 variants must render as before.
    it.each([
      [undefined, "error", IconWarningCircle],
      ["danger", "error", IconWarningCircle],
      ["warning", "warning", IconWarning],
      ["info", "info", IconInfo],
      ["primary", "primary", IconSealQuestion],
    ] as const)("variant %s sets the tile and confirm button colour and the icon", async (variant, color, icon) => {
      const wrapper = await open(variant ? { variant } : {});
      expect(tile()).not.toBeNull();
      // Decorative: the title and message carry the meaning.
      expect(tile()!.getAttribute("aria-hidden")).toBe("true");
      expect(tileIcon(wrapper).props("icon")).toBe(icon);
      // A variant's icon must never read as CuiIcon's "unknown name" glyph.
      expect(tileIcon(wrapper).props("icon")).not.toBe(FALLBACK_ICON);
      expect(tile()!.getAttribute("style")).toContain(`var(--cui-${color}-bg)`);
      expect(findButtonByText(wrapper, "Go").props("color")).toBe(color);
      wrapper.unmount();
    });

    it.each(VARIANTS)(":icon=\"false\" renders no tile (%s)", async (variant) => {
      const wrapper = await open({ variant, icon: false });
      expect(tile()).toBeNull();
      // The header row holds only the text column and the close button, so the
      // flex gap opens no empty space before the title.
      const title = document.querySelector(".cui-confirm-dialog__title")!;
      const header = title.parentElement!.parentElement!;
      expect(header.children).toHaveLength(2);
      expect(header.firstElementChild).toBe(title.parentElement);
      wrapper.unmount();
    });

    it("accepts an icon name or an icon component", async () => {
      const named = await open({ icon: "info" });
      expect(tileIcon(named).props("name")).toBe("info");
      named.unmount();

      const component = await open({ icon: PhRocket });
      // mount() props are reactive, so the component arrives proxied.
      expect(toRaw(tileIcon(component).props("icon"))).toBe(PhRocket);
      expect(tileIcon(component).props("name")).toBeUndefined();
      component.unmount();
    });

    it.each(VARIANTS)("confirmColor overrides only the confirm button's colour (%s)", async (variant) => {
      const wrapper = await open({ variant, confirmColor: "success" });
      expect(findButtonByText(wrapper, "Go").props("color")).toBe("success");
      // The tile keeps the variant's colour.
      expect(tile()!.getAttribute("style")).not.toContain("--cui-success");
      wrapper.unmount();
    });

    it("keeps the type-to-confirm gate and the accessible name with the new options", async () => {
      const wrapper = await open({
        variant: "primary",
        icon: false,
        confirmColor: "success",
        confirmWord: "apply",
        title: "Apply profile?",
      });
      const dialog = document.querySelector('[role="dialog"]')!;
      const labelledBy = dialog.getAttribute("aria-labelledby")!;
      expect(document.getElementById(labelledBy)?.textContent?.trim()).toBe("Apply profile?");

      const confirmBtn = findButtonByText(wrapper, "Go");
      expect(confirmBtn.attributes("disabled")).toBeDefined();
      await wrapper.findComponent(CuiInput).setValue("apply");
      expect(confirmBtn.attributes("disabled")).toBeUndefined();
      await confirmBtn.trigger("click");
      expect(wrapper.emitted("confirm")).toHaveLength(1);
      wrapper.unmount();
    });
  });
});

describe("CuiConfirmDialog focus forwarding (#437)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("passes initialFocus and returnFocus to its CuiModal", async () => {
    const returnFocus = () => null;
    const wrapper = mount(CuiConfirmDialog, {
      props: { visible: true, initialFocus: "button", returnFocus },
    });
    await flushPromises();
    const modal = wrapper.findComponent(CuiModal);
    expect(modal.props("initialFocus")).toBe("button");
    expect(modal.props("returnFocus")).toBe(returnFocus);
    wrapper.unmount();
  });

  it("leaves both unset when none is given, so returnFocus is not cast to false", async () => {
    const wrapper = mount(CuiConfirmDialog, { props: { visible: true } });
    await flushPromises();
    const modal = wrapper.findComponent(CuiModal);
    expect(modal.props("initialFocus")).toBeUndefined();
    expect(modal.props("returnFocus")).toBeUndefined();
    wrapper.unmount();
  });

  it("re-emits the modal's after-enter and after-leave, once each", async () => {
    // Stubbed, so the real modal's own transition timing can't add emits of its own.
    const wrapper = mount(CuiConfirmDialog, { props: { visible: true }, global: { stubs: { CuiModal: true } } });
    const modal = wrapper.findComponent(CuiModal);
    modal.vm.$emit("after-enter");
    expect(wrapper.emitted("after-enter")).toHaveLength(1);
    expect(wrapper.emitted("after-leave")).toBeUndefined();
    modal.vm.$emit("after-leave");
    expect(wrapper.emitted("after-leave")).toHaveLength(1);
    expect(wrapper.emitted("after-enter")).toHaveLength(1);
    wrapper.unmount();
  });
});
