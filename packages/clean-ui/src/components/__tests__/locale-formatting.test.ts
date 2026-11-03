import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import CuiConfigProvider from "../CuiConfigProvider.vue";
import CuiDatePicker from "../CuiDatePicker.vue";
import CuiDateRangePicker from "../CuiDateRangePicker.vue";
import CuiFileUpload from "../CuiFileUpload.vue";
import CuiTimePicker from "../CuiTimePicker.vue";
import { useLocale } from "../../composables/useLocale";
import { configureCleanUI } from "../../utils/configure";

/**
 * #337 — month and weekday text, day labels, file sizes and the AM/PM labels follow the
 * library's locale. Date pickers mount their panel into a popover, found by role.
 */
describe("locale formatting (#337)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    configureCleanUI({ locale: "" });
    document.documentElement.removeAttribute("lang");
    document.body.innerHTML = "";
  });

  /** A component inside a provider for `locale` (none: no provider at all). */
  function within(locale: string | undefined, component: object, props: Record<string, unknown>) {
    const inner = () => h(component, props);
    return mount(
      locale ? defineComponent({ render: () => h(CuiConfigProvider, { locale }, inner) }) : defineComponent({ render: inner }),
      { attachTo: document.body },
    );
  }

  /** A mount, once the value it was given has been read (that happens on mount). */
  async function settled<T extends VueWrapper>(w: T) {
    await w.vm.$nextTick();
    return w;
  }

  async function open(w: VueWrapper) {
    await w.find(".cui-popover > div").trigger("click");
    await w.vm.$nextTick();
    await w.vm.$nextTick();
  }

  const gridCell = (key: string) => document.querySelector<HTMLElement>(`[data-cui-cell="${key}"]`)!;
  const panelText = () => document.body.textContent ?? "";

  describe.each([
    ["CuiDatePicker", CuiDatePicker],
    ["CuiDateRangePicker", CuiDateRangePicker],
  ])("%s", (_name, component) => {
    const props = { modelValue: component === CuiDatePicker ? "2026-10-20" : { start: "2026-10-20", end: null } };

    it("is English with no locale, as before", async () => {
      wrapper = within(undefined, component, props);
      await open(wrapper);
      expect(panelText()).toContain("Oct");
      expect(panelText()).toContain("Tu");
      expect(document.querySelector('[role="grid"]')!.getAttribute("aria-label")).toBe("October 2026");
      expect(gridCell("d:2026-9-20").getAttribute("aria-label")).toBe("Tuesday, October 20, 2026");
    });

    it("shows German month and weekday text and day labels", async () => {
      wrapper = within("de", component, props);
      await open(wrapper);
      expect(panelText()).toContain("Okt");
      expect(panelText()).toContain("So");
      expect(panelText()).toContain("Di");
      expect(panelText()).not.toContain("Tu");
      expect(document.querySelector('[role="grid"]')!.getAttribute("aria-label")).toBe("Oktober 2026");
      expect(gridCell("d:2026-9-20").getAttribute("aria-label")).toBe("Dienstag, 20. Oktober 2026");
    });

    it("shows Japanese month and weekday text and day labels", async () => {
      wrapper = within("ja", component, props);
      await open(wrapper);
      expect(panelText()).toContain("10月");
      expect(panelText()).toContain("火");
      expect(gridCell("d:2026-9-20").getAttribute("aria-label")).toBe("2026年10月20日火曜日");
    });
  });

  it("writes the display format's month name in the locale", async () => {
    wrapper = await settled(within("de", CuiDateRangePicker, {
      modelValue: { start: "2026-03-05", end: "2026-03-09" },
      format: "D MMMM YYYY",
    }));
    const shown = wrapper.findAll("input").map((i) => (i.element as HTMLInputElement).value).join("|") + wrapper.text();
    expect(shown).toContain("5 März 2026");
    expect(shown).toContain("9 März 2026");
  });

  describe("CuiFileUpload sizes", () => {
    const maxFileSize = 1.5 * 1024 * 1024;

    it("keeps '.' in English", () => {
      wrapper = within(undefined, CuiFileUpload, { maxFileSize });
      expect(wrapper.text()).toContain("Max 1.5 MB");
    });

    it("uses the locale's decimal separator", () => {
      wrapper = within("de", CuiFileUpload, { maxFileSize });
      expect(wrapper.text()).toContain("Max 1,5 MB");
    });
  });

  describe("CuiTimePicker", () => {
    it("labels AM/PM in the locale while the model stays 'hh:mm AM/PM'", async () => {
      wrapper = await settled(within("ja", CuiTimePicker, { modelValue: "09:30 AM", format: "12" }));
      expect(wrapper.text()).toContain("09:30 午前");
      await open(wrapper);
      const buttons = [...document.querySelectorAll(".cui-time-picker__period")];
      expect(buttons.map((b) => b.textContent?.trim())).toEqual(["午前", "午後"]);
      (buttons[1] as HTMLElement).click();
      await wrapper.vm.$nextTick();
      const emitted = wrapper.findComponent(CuiTimePicker).emitted("update:modelValue");
      expect(emitted?.at(-1)).toEqual(["09:30 PM"]);
    });

    it("is AM/PM in English", async () => {
      wrapper = await settled(within(undefined, CuiTimePicker, { modelValue: "09:30 AM", format: "12" }));
      expect(wrapper.text()).toContain("09:30 AM");
    });
  });

  it("follows a provider's locale as it changes", async () => {
    const current = ref("de");
    wrapper = mount(
      defineComponent({ render: () => h(CuiConfigProvider, { locale: current.value }, () => h(CuiFileUpload, { maxFileSize: 1572864 })) }),
      { attachTo: document.body },
    );
    expect(wrapper.text()).toContain("Max 1,5 MB");
    current.value = "en";
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Max 1.5 MB");
  });

  describe("useLocale", () => {
    function resolved(locale?: string) {
      let value = "";
      const probe = defineComponent({ setup() { const l = useLocale(); return () => ((value = l.value), h("i")); } });
      wrapper = within(locale, probe, {});
      return () => value;
    }

    it("defaults to en", () => {
      expect(resolved()()).toBe("en");
    });

    it("follows the document's lang", () => {
      document.documentElement.lang = "de-AT";
      expect(resolved()()).toBe("de-AT");
    });

    it("prefers a provider's locale over the document's", () => {
      document.documentElement.lang = "de";
      expect(resolved("ja")()).toBe("ja");
    });

    it("falls through a rejected provider locale to the next valid one", () => {
      configureCleanUI({ locale: "fr" });
      expect(resolved("de_DE")()).toBe("fr");
    });

    it("takes the global locale, and ignores a tag Intl rejects", () => {
      document.documentElement.lang = "fr";
      configureCleanUI({ locale: "ja" });
      expect(resolved()()).toBe("ja");
      wrapper?.unmount();
      configureCleanUI({ locale: "not a locale!" });
      expect(resolved()()).toBe("fr");
    });
  });
});
