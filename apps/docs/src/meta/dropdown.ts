import type { ComponentMeta, PropRow } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const menuItemDisabled: PropRow = {
  name: "disabled",
  type: "boolean",
  default: "false",
  description: "Dims the item, sets aria-disabled, and takes it out of the arrow-key sequence",
};

const meta: ComponentMeta = {
  name: "Dropdown",
  description:
    "Floating menu with action items, check items, radio groups, headers, dividers and nested sub-menus. Assembled from sub-components that share state through provide/inject.",
  interactive: true,

  parts: [
    {
      name: "CuiDropdown",
      props: [
        {
          name: "trigger",
          type: "click | hover | hover-focus",
          default: "click",
          description: "What opens the menu. Sub-menus inherit this unless they override it",
        },
        {
          name: "placement",
          type: "bottom | top | left | right",
          default: "bottom",
          description: "Preferred side. Flips automatically when there is not room",
        },
        {
          name: "pinned",
          type: "boolean",
          default: "false",
          description: "Reposition on scroll instead of closing — for a menu that must survive a scrolling page",
        },
        { ...disabledProp, description: "Prevents the menu opening at all" },
        hiddenProp,
      ],
      slots: [
        {
          name: "default",
          payload: "{ isOpen, open, close, toggle }",
          description: "CuiDropdownTrigger and CuiDropdownMenu. The slot props let you drive it yourself",
        },
      ],
    },
    {
      name: "CuiDropdownTrigger",
      slots: [{ name: "default", description: "The element that opens the menu — normally a CuiButton" }],
    },
    {
      name: "CuiDropdownMenu",
      props: [
        { name: "minWidth", type: "string", default: "12rem", description: "Minimum panel width" },
      ],
      slots: [{ name: "default", description: "Menu items, dividers, headers and sub-menus" }],
    },
    {
      name: "CuiDropdownItem",
      props: [
        { name: "shortcut", type: "string", description: "Keyboard hint, right-aligned. Display only — it binds nothing" },
        { name: "description", type: "string", description: "Second line beneath the label" },
        {
          name: "closeOnSelect",
          type: "boolean",
          default: "true",
          description: "Close the whole dropdown when this item is chosen",
        },
        menuItemDisabled,
        hiddenProp,
      ],
      slots: [
        { name: "default", description: "Item label" },
        { name: "icon", description: "Leading icon" },
      ],
      events: [{ name: "select", payload: "—", description: "Chosen by click, Enter or Space" }],
    },
    {
      name: "CuiDropdownCheckItem",
      props: [
        { name: "v-model", type: "boolean", default: "false", description: "Checked state" },
        menuItemDisabled,
      ],
      slots: [{ name: "default", description: "Item label" }],
      events: [{ name: "update:modelValue", payload: "boolean", description: "Toggled — what v-model binds to" }],
    },
    {
      name: "CuiDropdownRadioGroup",
      props: [
        { name: "v-model", type: "string | number", description: "The selected item's value" },
        {
          name: "label",
          type: "string",
          description: "Accessible group name. Used only when aria-labelledby names nothing",
        },
        { name: "aria-labelledby", type: "string", description: "id(s) of the element naming the group" },
        { name: "aria-describedby", type: "string", description: "id(s) of describing text" },
      ],
      slots: [{ name: "default", description: "CuiDropdownRadioItems" }],
      events: [
        { name: "update:modelValue", payload: "string | number", description: "An item was selected" },
      ],
    },
    {
      name: "CuiDropdownRadioItem",
      props: [
        { name: "value", type: "string | number", description: "This item's value, compared against the group's v-model" },
        menuItemDisabled,
      ],
      slots: [{ name: "default", description: "Item label" }],
    },
    {
      name: "CuiDropdownSub",
      props: [
        {
          name: "trigger",
          type: "click | hover | hover-focus",
          default: "inherited",
          description: "Override the parent dropdown's trigger for this sub-menu only",
        },
        menuItemDisabled,
      ],
      slots: [
        { name: "default", description: "The sub-menu's own label in the parent menu" },
        { name: "icon", description: "Leading icon on that label" },
        { name: "menu", description: "The sub-menu's items" },
      ],
    },
    {
      name: "CuiDropdownHeader",
      slots: [{ name: "default", description: "Group label text. Non-interactive, and skipped by arrow keys" }],
    },
  ],
};

export default meta;
