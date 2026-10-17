import { describe, it, expect, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import CuiModal from "../CuiModal.vue";
import CuiSlideover from "../CuiSlideover.vue";
import CuiConfirmDialog from "../CuiConfirmDialog.vue";
import CuiPopover from "../CuiPopover.vue";

/** The text of the element `aria-labelledby` points at — asserting that it resolves. */
function labelOf(dialog: Element): string {
  const id = dialog.getAttribute("aria-labelledby");
  expect(id, "aria-labelledby present").toBeTruthy();
  // The part that was broken: the id has to point at something real, and at this
  // dialog's own title rather than another's with the same id.
  const label = document.getElementById(id!);
  expect(label, `aria-labelledby="${id}" resolves to an element`).not.toBeNull();
  expect(dialog.contains(label), "the label is inside this dialog").toBe(true);
  return label!.textContent!.trim();
}

/**
 * #158 — all three dialogs advertised a name they did not have. `CuiModal` and
 * `CuiSlideover` generated a `titleId`, pointed `aria-labelledby` at it and never rendered
 * it on anything; `CuiConfirmDialog` assembles its own header, so `CuiModal` had no `title`
 * to name itself from and emitted no `aria-labelledby` at all.
 *
 * These assert that the reference *resolves*, not merely that the attribute is present —
 * a dangling IDREF is exactly the defect that reads as correct in the template and in
 * review, and only an actual lookup catches it.
 */
describe("dialogs are announced with their title as the accessible name", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each([
    ["CuiModal", CuiModal, { visible: true, title: "Confirm action" }, "Confirm action"],
    ["CuiSlideover", CuiSlideover, { visible: true, title: "Edit profile" }, "Edit profile"],
    ["CuiConfirmDialog", CuiConfirmDialog, { visible: true, title: "Delete file?" }, "Delete file?"],
  ])("%s", async (_name, component, props, expected) => {
    mount(component as never, { props });
    await flushPromises();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog, "dialog rendered").not.toBeNull();
    expect(labelOf(dialog!)).toBe(expected);
  });

  it("gives each instance its own id, so two dialogs do not collide", async () => {
    mount(CuiModal, { props: { visible: true, title: "One" } });
    mount(CuiModal, { props: { visible: true, title: "Two" } });
    await flushPromises();

    const ids = [...document.body.querySelectorAll('[role="dialog"]')].map((d) =>
      d.getAttribute("aria-labelledby"),
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size, "ids are distinct").toBe(2);
  });

  // #159: the popover's header id was the literal "cui-popover-title", so every titled
  // popover on a page shared it, and a #header slot without the title prop gave no name.
  // A popover opens from its trigger or a prop change, not on mount, hence the toggle.
  describe("CuiPopover", () => {
    async function openPopovers(popovers: Array<Record<string, unknown>>) {
      const visible = ref(false);
      // One app, as on a real page: useId() is unique per app.
      mount(
        defineComponent(() => () =>
          popovers.map(({ slots, ...props }) =>
            h(CuiPopover, { ...props, visible: visible.value }, {
              default: () => h("button", "Open"),
              content: () => "Body",
              ...(slots as object),
            }),
          ),
        ),
        { attachTo: document.body },
      );
      visible.value = true;
      await nextTick();
      return [...document.body.querySelectorAll('[role="dialog"]')];
    }

    it("gives each titled popover on a page its own title", async () => {
      const dialogs = await openPopovers([{ title: "First" }, { title: "Second" }]);
      expect(dialogs.map(labelOf)).toEqual(["First", "Second"]);
    });

    it("is named by a #header slot used without the title prop, leaving out the close button", async () => {
      const [dialog] = await openPopovers([{ closable: true, slots: { header: () => h("strong", "Custom header") } }]);
      expect(labelOf(dialog)).toBe("Custom header");
    });

    it("has no aria-labelledby without a header", async () => {
      const [dialog] = await openPopovers([{}]);
      expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
    });
  });
});
