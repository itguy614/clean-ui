import { describe, it, expect, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CuiModal from "../CuiModal.vue";
import CuiSlideover from "../CuiSlideover.vue";
import CuiConfirmDialog from "../CuiConfirmDialog.vue";

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

    const id = dialog!.getAttribute("aria-labelledby");
    expect(id, "aria-labelledby present").toBeTruthy();

    // The part that was broken: the id has to point at something real.
    const label = document.getElementById(id!);
    expect(label, `aria-labelledby="${id}" resolves to an element`).not.toBeNull();
    expect(label!.textContent?.trim()).toBe(expected);
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
});
