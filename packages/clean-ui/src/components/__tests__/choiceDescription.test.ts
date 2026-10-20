import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h, nextTick, ref } from "vue";
import CuiCheckbox from "../CuiCheckbox.vue";
import CuiRadio from "../CuiRadio.vue";
import CuiToggle from "../CuiToggle.vue";
import { useFieldDescribedBy } from "../../composables/useFieldDescribedBy";

/**
 * #183 — the description rendered inside the role-carrying root, so it was read as part of
 * the accessible name. The control is now named by its label span and described by the
 * description.
 */

const byId = (w: ReturnType<typeof mount>, id: string | undefined) => (id ? w.find(`#${id}`).text() : undefined);

describe.each([
  ["CuiCheckbox", CuiCheckbox, "checkbox"],
  ["CuiRadio", CuiRadio, "radio"],
  ["CuiToggle", CuiToggle, "switch"],
] as const)("%s description", (_name, Comp, role) => {
  it("is the description, not part of the name", () => {
    const w = mount(Comp, { props: { label: "Email notifications", description: "Security issues only", value: "x" } });
    const control = w.find(`[role="${role}"]`);
    expect(byId(w, control.attributes("aria-labelledby"))).toBe("Email notifications");
    expect(byId(w, control.attributes("aria-describedby"))).toBe("Security issues only");
  });

  it("comes before a caller's descriptions, and a caller's name wins", () => {
    const w = mount(Comp, {
      props: { label: "L", description: "D", ariaDescribedby: "help", ariaLabelledby: "outer", value: "x" },
    });
    const control = w.find(`[role="${role}"]`);
    expect(control.attributes("aria-describedby")!.split(" ")).toEqual([expect.stringContaining("description"), "help"]);
    expect(control.attributes("aria-labelledby")).toBe("outer");
  });

  it("changes nothing without a description", () => {
    const w = mount(Comp, { props: { label: "L", value: "x" } });
    const control = w.find(`[role="${role}"]`);
    expect(control.attributes("aria-labelledby")).toBeUndefined();
    expect(control.attributes("aria-describedby")).toBeUndefined();
  });

  it("follows a #description slot that comes later", async () => {
    const show = ref(false);
    const w = mount({
      render: () => h(Comp, { label: "L", value: "x" }, show.value ? { description: () => "Later" } : {}),
    });
    const control = () => w.find(`[role="${role}"]`);
    expect(control().attributes("aria-describedby")).toBeUndefined();
    show.value = true;
    await nextTick();
    expect(byId(w, control().attributes("aria-describedby"))).toBe("Later");
    expect(byId(w, control().attributes("aria-labelledby"))).toBe("L");
  });

  it("keeps its description as its name when it has no label", () => {
    const w = mount(Comp, { props: { description: "Only text", value: "x" } });
    expect(w.find(`[role="${role}"]`).attributes("aria-labelledby")).toBeUndefined();
  });

  it("defers to a consumer's aria-label", () => {
    const w = mount(Comp, { props: { label: "L", description: "D", value: "x" }, attrs: { "aria-label": "Named" } });
    expect(w.find(`[role="${role}"]`).attributes("aria-labelledby")).toBeUndefined();
  });

  it("takes a #description slot too", () => {
    const w = mount(Comp, { props: { label: "L", value: "x" }, slots: { description: () => h("em", "Slotted") } });
    const control = w.find(`[role="${role}"]`);
    expect(byId(w, control.attributes("aria-describedby"))).toBe("Slotted");
  });
});

describe("useFieldDescribedBy order", () => {
  it("is description, then the caller's ids, then the error", () => {
    const { describedBy } = useFieldDescribedBy(
      { id: "f", ariaDescribedby: "help", error: true, errorMessage: "Bad" },
      { descriptionId: () => "desc" },
    );
    expect(describedBy.value).toBe("desc help f-error");
  });
});
