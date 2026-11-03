import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import CuiAvatarGroup from "../CuiAvatarGroup.vue";
import CuiAvatar from "../CuiAvatar.vue";
import { CuiConfigProvider } from "../../index";

const NAMES = ["Alice", "Bob", "Carol", "David", "Eva"];

function mountGroup(max?: number, extra = "") {
  return mount(
    defineComponent({
      components: { CuiAvatarGroup, CuiAvatar },
      props: { max: Number },
      setup: () => ({ names: NAMES }),
      template: `<CuiAvatarGroup :max="max"><CuiAvatar v-for="n in names" :key="n" :name="n" ${extra} /></CuiAvatarGroup>`,
    }),
    { props: { max } },
  );
}

const overflow = (w: ReturnType<typeof mountGroup>) => w.find(".cui-avatar-group__overflow");

describe("CuiAvatarGroup max", () => {
  it("shows every avatar when max is unset", () => {
    const w = mountGroup();
    expect(w.findAll(".cui-avatar")).toHaveLength(5);
    expect(overflow(w).exists()).toBe(false);
  });

  it("shows the first max avatars and a +N avatar for the rest", () => {
    const w = mountGroup(2);
    const avatars = w.findAll(".cui-avatar");
    expect(avatars).toHaveLength(3);
    expect(avatars.slice(0, 2).map((a) => a.text())).toEqual(["A", "B"]);
    expect(overflow(w).text()).toBe("+3");
  });

  it("names the overflow avatar for assistive technology", () => {
    const o = overflow(mountGroup(2));
    expect(o.attributes("role")).toBe("img");
    expect(o.attributes("aria-label")).toBe("3 more");
  });

  it("takes the label from the configured messages", () => {
    const w = mount(
      defineComponent({
        components: { CuiConfigProvider, CuiAvatarGroup, CuiAvatar },
        setup: () => ({ messages: { avatar: { overflow: (n: number) => `${n} weitere` } } }),
        template: `<CuiConfigProvider :messages="messages"><CuiAvatarGroup :max="1"><CuiAvatar name="A" /><CuiAvatar name="B" /></CuiAvatarGroup></CuiConfigProvider>`,
      }),
    );
    expect(w.find(".cui-avatar-group__overflow").attributes("aria-label")).toBe("1 weitere");
  });

  it("matches the size of the avatars it follows", () => {
    const w = mountGroup(1, 'size="lg"');
    const [first] = w.findAll(".cui-avatar");
    expect(overflow(w).attributes("style")).toContain(first.element.style.width);
  });

  it("adds no overflow when max equals or exceeds the count", () => {
    for (const max of [5, 6, 100]) {
      const w = mountGroup(max);
      expect(w.findAll(".cui-avatar")).toHaveLength(5);
      expect(overflow(w).exists()).toBe(false);
    }
  });

  it("shows only the +N avatar when max is zero or negative", () => {
    for (const max of [0, -3]) {
      const w = mountGroup(max);
      expect(w.findAll(".cui-avatar")).toHaveLength(1);
      expect(overflow(w).text()).toBe("+5");
    }
  });

  it("caps the visible count at 99+ and keeps the exact count in the label", () => {
    const w = mount(
      defineComponent({
        components: { CuiAvatarGroup, CuiAvatar },
        setup: () => ({ names: Array.from({ length: 150 }, (_, i) => `N${i}`) }),
        template: `<CuiAvatarGroup :max="2"><CuiAvatar v-for="n in names" :key="n" :name="n" /></CuiAvatarGroup>`,
      }),
    );
    expect(overflow(w).text()).toBe("99+");
    expect(overflow(w).attributes("aria-label")).toBe("148 more");
  });

  it("truncates a fractional max", () => {
    const w = mountGroup(1.9);
    expect(w.findAll(".cui-avatar")).toHaveLength(2);
    expect(overflow(w).text()).toBe("+4");
  });

  it("counts again when the slot's children change", async () => {
    const names = ref(["A", "B", "C"]);
    const w = mount(
      defineComponent({
        components: { CuiAvatarGroup, CuiAvatar },
        setup: () => ({ names }),
        template: `<CuiAvatarGroup :max="2"><CuiAvatar v-for="n in names" :key="n" :name="n" /></CuiAvatarGroup>`,
      }),
    );
    expect(overflow(w).text()).toBe("+1");
    names.value = ["A", "B", "C", "D", "E"];
    await w.vm.$nextTick();
    expect(overflow(w).text()).toBe("+3");
    names.value = ["A", "B"];
    await w.vm.$nextTick();
    expect(overflow(w).exists()).toBe(false);
    expect(w.findAll(".cui-avatar")).toHaveLength(2);
  });

  it("ignores v-if comments and whitespace when counting", () => {
    const w = mount(
      defineComponent({
        components: { CuiAvatarGroup, CuiAvatar },
        template: `<CuiAvatarGroup :max="1"><CuiAvatar name="A" /><CuiAvatar v-if="false" name="X" /> <CuiAvatar name="B" /></CuiAvatarGroup>`,
      }),
    );
    expect(overflow(w).text()).toBe("+1");
  });
});
