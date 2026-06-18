import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import CuiDropdown from "../CuiDropdown.vue";
import CuiDropdownTrigger from "../CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../CuiDropdownMenu.vue";
import CuiDropdownItem from "../CuiDropdownItem.vue";
import CuiDropdownCheckItem from "../CuiDropdownCheckItem.vue";
import CuiDropdownRadioGroup from "../CuiDropdownRadioGroup.vue";
import CuiDropdownRadioItem from "../CuiDropdownRadioItem.vue";
import CuiDropdownSub from "../CuiDropdownSub.vue";
import CuiDropdownDivider from "../CuiDropdownDivider.vue";
import CuiDropdownHeader from "../CuiDropdownHeader.vue";

// The menu teleports to document.body and renders only while open (or closing).
const menuInBody = () => document.body.querySelector(".cui-dropdown-menu");

function mountDropdown(itemProps: Record<string, unknown> = {}, onSelect?: () => void) {
  return mount(CuiDropdown, {
    attachTo: document.body,
    slots: {
      default: () => [
        h(CuiDropdownTrigger, () => h("button", "Menu")),
        h(CuiDropdownMenu, () => [
          h(CuiDropdownItem, { ...itemProps, onSelect }, () => "Item One"),
        ]),
      ],
    },
  });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("CuiDropdown behavior", () => {
  it("does not render the menu until the trigger is clicked", async () => {
    const wrapper = mountDropdown();
    expect(menuInBody()).toBeNull();

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    expect(menuInBody()).not.toBeNull();
    expect(menuInBody()?.textContent).toContain("Item One");

    wrapper.unmount();
  });

  it("toggles closed when the trigger is clicked again", async () => {
    vi.useFakeTimers();
    const wrapper = mountDropdown();
    const trigger = wrapper.find(".cui-dropdown-trigger");

    await trigger.trigger("click");
    expect(menuInBody()).not.toBeNull();

    // Second click starts the close animation; advance past the 150ms timer.
    await trigger.trigger("click");
    vi.advanceTimersByTime(200);
    await wrapper.vm.$nextTick();
    expect(menuInBody()).toBeNull();

    vi.useRealTimers();
    wrapper.unmount();
  });

  it("fires @select and closes when an item is clicked", async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    const wrapper = mountDropdown({}, onSelect);

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    const item = menuInBody()?.querySelector<HTMLElement>('[role="menuitem"]');
    expect(item).not.toBeNull();

    item!.click();
    expect(onSelect).toHaveBeenCalledTimes(1);

    // closeOnSelect defaults true -> closeAll() -> isClosing -> 150ms timer.
    vi.advanceTimersByTime(200);
    await wrapper.vm.$nextTick();
    expect(menuInBody()).toBeNull();

    vi.useRealTimers();
    wrapper.unmount();
  });

  it("does not close on select when closeOnSelect is false", async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    const wrapper = mountDropdown({ closeOnSelect: false }, onSelect);

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    const item = menuInBody()?.querySelector<HTMLElement>('[role="menuitem"]');
    item!.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    await wrapper.vm.$nextTick();
    expect(menuInBody()).not.toBeNull();

    vi.useRealTimers();
    wrapper.unmount();
  });

  it("does not fire @select for a disabled item", async () => {
    const onSelect = vi.fn();
    const wrapper = mountDropdown({ disabled: true }, onSelect);

    await wrapper.find(".cui-dropdown-trigger").trigger("click");
    const item = menuInBody()?.querySelector<HTMLElement>('[role="menuitem"]');
    item!.click();

    expect(onSelect).not.toHaveBeenCalled();
    expect(menuInBody()).not.toBeNull();

    wrapper.unmount();
  });
});

// --- Sub-components that require CuiDropdown's injected context ---

async function openMenu(wrapper: ReturnType<typeof mount>) {
  await wrapper.find(".cui-dropdown-trigger").trigger("click");
}

describe("CuiDropdownCheckItem", () => {
  it("toggles its checked state and emits update:modelValue on click", async () => {
    const Host = defineComponent({
      components: { CuiDropdown, CuiDropdownTrigger, CuiDropdownMenu, CuiDropdownCheckItem },
      setup() {
        const checked = ref(false);
        return { checked };
      },
      template: `
        <CuiDropdown>
          <CuiDropdownTrigger><button>Menu</button></CuiDropdownTrigger>
          <CuiDropdownMenu>
            <CuiDropdownCheckItem v-model="checked">Show grid</CuiDropdownCheckItem>
          </CuiDropdownMenu>
        </CuiDropdown>
      `,
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await openMenu(wrapper);

    const item = document.body.querySelector<HTMLElement>('[role="menuitemcheckbox"]');
    expect(item).not.toBeNull();
    expect(item!.getAttribute("aria-checked")).toBe("false");

    item!.click();
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as unknown as { checked: boolean }).checked).toBe(true);
    expect(
      document.body.querySelector('[role="menuitemcheckbox"]')!.getAttribute("aria-checked"),
    ).toBe("true");

    wrapper.unmount();
  });

  it("does not toggle when disabled", async () => {
    const Host = defineComponent({
      components: { CuiDropdown, CuiDropdownTrigger, CuiDropdownMenu, CuiDropdownCheckItem },
      setup() {
        const checked = ref(false);
        return { checked };
      },
      template: `
        <CuiDropdown>
          <CuiDropdownTrigger><button>Menu</button></CuiDropdownTrigger>
          <CuiDropdownMenu>
            <CuiDropdownCheckItem v-model="checked" disabled>Show grid</CuiDropdownCheckItem>
          </CuiDropdownMenu>
        </CuiDropdown>
      `,
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await openMenu(wrapper);

    document.body.querySelector<HTMLElement>('[role="menuitemcheckbox"]')!.click();
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as unknown as { checked: boolean }).checked).toBe(false);
    wrapper.unmount();
  });
});

describe("CuiDropdownRadioGroup + CuiDropdownRadioItem", () => {
  it("single-selects within the group and reflects aria-checked", async () => {
    const Host = defineComponent({
      components: {
        CuiDropdown,
        CuiDropdownTrigger,
        CuiDropdownMenu,
        CuiDropdownRadioGroup,
        CuiDropdownRadioItem,
      },
      setup() {
        const sort = ref("name");
        return { sort };
      },
      template: `
        <CuiDropdown>
          <CuiDropdownTrigger><button>Menu</button></CuiDropdownTrigger>
          <CuiDropdownMenu>
            <CuiDropdownRadioGroup v-model="sort">
              <CuiDropdownRadioItem value="name">Name</CuiDropdownRadioItem>
              <CuiDropdownRadioItem value="date">Date</CuiDropdownRadioItem>
            </CuiDropdownRadioGroup>
          </CuiDropdownMenu>
        </CuiDropdown>
      `,
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await openMenu(wrapper);

    const items = document.body.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    expect(items).toHaveLength(2);
    expect(items[0].getAttribute("aria-checked")).toBe("true");
    expect(items[1].getAttribute("aria-checked")).toBe("false");

    items[1].click();
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as unknown as { sort: string }).sort).toBe("date");
    const after = document.body.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    expect(after[0].getAttribute("aria-checked")).toBe("false");
    expect(after[1].getAttribute("aria-checked")).toBe("true");

    wrapper.unmount();
  });
});

describe("CuiDropdownSub", () => {
  it("renders a submenu trigger and opens the nested menu on click", async () => {
    const Host = defineComponent({
      components: {
        CuiDropdown,
        CuiDropdownTrigger,
        CuiDropdownMenu,
        CuiDropdownItem,
        CuiDropdownSub,
      },
      template: `
        <CuiDropdown>
          <CuiDropdownTrigger><button>Menu</button></CuiDropdownTrigger>
          <CuiDropdownMenu>
            <CuiDropdownSub trigger="click">
              More
              <template #menu>
                <CuiDropdownItem>Nested item</CuiDropdownItem>
              </template>
            </CuiDropdownSub>
          </CuiDropdownMenu>
        </CuiDropdown>
      `,
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await openMenu(wrapper);

    const subTrigger = document.body.querySelector<HTMLElement>(
      '.cui-dropdown-sub__trigger',
    );
    expect(subTrigger).not.toBeNull();
    expect(subTrigger!.getAttribute("aria-haspopup")).toBe("true");
    expect(subTrigger!.getAttribute("aria-expanded")).toBe("false");
    expect(document.body.querySelector(".cui-dropdown-sub__menu")).toBeNull();

    subTrigger!.click();
    await wrapper.vm.$nextTick();

    expect(
      document.body
        .querySelector(".cui-dropdown-sub__trigger")!
        .getAttribute("aria-expanded"),
    ).toBe("true");
    const subMenu = document.body.querySelector(".cui-dropdown-sub__menu");
    expect(subMenu).not.toBeNull();
    expect(subMenu!.textContent).toContain("Nested item");

    wrapper.unmount();
  });
});

describe("CuiDropdownDivider + CuiDropdownHeader", () => {
  it("renders the header and divider inside the open menu", async () => {
    const Host = defineComponent({
      components: {
        CuiDropdown,
        CuiDropdownTrigger,
        CuiDropdownMenu,
        CuiDropdownItem,
        CuiDropdownDivider,
        CuiDropdownHeader,
      },
      template: `
        <CuiDropdown>
          <CuiDropdownTrigger><button>Menu</button></CuiDropdownTrigger>
          <CuiDropdownMenu>
            <CuiDropdownHeader>Account</CuiDropdownHeader>
            <CuiDropdownItem>Profile</CuiDropdownItem>
            <CuiDropdownDivider />
            <CuiDropdownItem>Sign out</CuiDropdownItem>
          </CuiDropdownMenu>
        </CuiDropdown>
      `,
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await openMenu(wrapper);

    const header = document.body.querySelector(".cui-dropdown-header");
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain("Account");
    expect(header!.getAttribute("role")).toBe("presentation");

    const divider = document.body.querySelector(".cui-dropdown-divider");
    expect(divider).not.toBeNull();
    expect(divider!.getAttribute("role")).toBe("separator");

    wrapper.unmount();
  });
});
