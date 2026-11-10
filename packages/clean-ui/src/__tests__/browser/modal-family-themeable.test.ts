import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import main from "../../styles/main.css?inline";
import { frames, injectStyle, installTokens, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiModalHeader from "../../components/CuiModalHeader.vue";
import CuiModalBody from "../../components/CuiModalBody.vue";
import CuiModalFooter from "../../components/CuiModalFooter.vue";
import CuiConfirmDialog from "../../components/CuiConfirmDialog.vue";

/**
 * #489 — a consumer restyles CuiModalHeader, CuiModalBody, CuiModalFooter and CuiConfirmDialog
 * without `!important`: a plain class rule at (0,1,0), or a public `--cui-<component>-*` token
 * on a container. Their paint sits in stylesheets at zero specificity, and the only inline
 * values left are the confirm dialog's private `--_confirm-dialog-*` properties.
 *
 * Real browser: every assertion is about the cascade `getComputedStyle` resolves. The confirm
 * dialog teleports to `<body>`, so `<body>` is the container its tokens are inherited from.
 */
describe("the modal family is themeable (real browser, #489)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const dom = mountHosts();
  const rules: Array<() => void> = [];
  afterEach(() => {
    dom.cleanup();
    rules.splice(0).forEach((remove) => remove());
    document.body.removeAttribute("style");
  });

  const consumerRule = (css: string) => rules.push(injectStyle(css));
  const css = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);
  const inlineNames = (el: HTMLElement) => [...Array(el.style.length).keys()].map((i) => el.style.item(i));

  function render(component: unknown, props: Record<string, unknown> = {}, hostStyle = "", slots: Record<string, () => unknown> = {}) {
    const host = dom.host();
    host.setAttribute("style", hostStyle);
    dom.track(mount(component as never, { props: props as never, slots: slots as never, attachTo: host }));
    return host;
  }

  describe("CuiModalHeader", () => {
    const mountHeader = (hostStyle = "", props: Record<string, unknown> = {}) =>
      render(CuiModalHeader, { title: "Title", ...props }, hostStyle, { actions: () => h("span", "act") }).querySelector<HTMLElement>(".cui-modal-header")!;

    it("writes no inline style", () => {
      const root = mountHeader();
      for (const el of [root, ...root.querySelectorAll<HTMLElement>("*")]) expect(el.getAttribute("style") ?? "", el.className.toString()).toBe("");
    });

    it("takes a plain class rule on the header, the title, the actions and the close button", () => {
      consumerRule(`
        .cui-modal-header { background: rgb(9, 9, 9); padding-top: 13px; gap: 3px; }
        .cui-modal-header__title { color: rgb(19, 19, 19); font-size: 21px; }
        .cui-modal-header__actions { gap: 11px; }
        .cui-modal-header__close { color: rgb(29, 29, 29); border-radius: 9px; }
        .cui-modal-header__close:hover { background: rgb(39, 39, 39); }
      `);
      const root = mountHeader();
      expect(css(root, "background-color")).toBe("rgb(9, 9, 9)");
      expect(css(root, "padding-top")).toBe("13px");
      expect(css(root, "column-gap")).toBe("3px");
      expect(css(root.querySelector(".cui-modal-header__title")!, "color")).toBe("rgb(19, 19, 19)");
      expect(css(root.querySelector(".cui-modal-header__title")!, "font-size")).toBe("21px");
      expect(css(root.querySelector(".cui-modal-header__actions")!, "column-gap")).toBe("11px");
      const close = root.querySelector(".cui-modal-header__close")!;
      expect(css(close, "color")).toBe("rgb(29, 29, 29)");
      expect(css(close, "border-top-left-radius")).toBe("9px");
    });

    it("takes the public tokens from a container", () => {
      const root = mountHeader(
        [
          "--cui-modal-header-bg: rgb(61, 61, 61)",
          "--cui-modal-header-gap: 5px",
          "--cui-modal-header-px: 17px",
          "--cui-modal-header-color: rgb(62, 62, 62)",
          "--cui-modal-header-font-size: 19px",
        ].join(";"),
      );
      expect(css(root, "background-color")).toBe("rgb(61, 61, 61)");
      expect(css(root, "column-gap")).toBe("5px");
      expect(css(root, "padding-left")).toBe("17px");
      expect(css(root, "padding-right")).toBe("17px");
      const title = root.querySelector(".cui-modal-header__title")!;
      expect(css(title, "color")).toBe("rgb(62, 62, 62)");
      expect(css(title, "font-size")).toBe("19px");
    });

    it("takes the hover tokens on the close button", async () => {
      consumerRule(".cui-modal-header__close { transition: none; }");
      const root = mountHeader("--cui-modal-header-hover-bg: rgb(71, 71, 71); --cui-modal-header-hover-color: rgb(72, 72, 72)");
      const close = root.querySelector<HTMLElement>(".cui-modal-header__close")!;
      // Not hovered yet: the resting colours.
      expect(css(close, "background-color")).not.toBe("rgb(71, 71, 71)");
      const { userEvent } = await import("@vitest/browser/context");
      await userEvent.hover(close);
      await frames(2);
      expect(css(close, "background-color")).toBe("rgb(71, 71, 71)");
      expect(css(close, "color")).toBe("rgb(72, 72, 72)");
    });
  });

  describe("CuiModalBody", () => {
    const mountBody = (hostStyle = "", props: Record<string, unknown> = {}) =>
      render(CuiModalBody, props, hostStyle, { default: () => h("p", "Body") }).querySelector<HTMLElement>(".cui-modal-body__content")!;

    it("writes no inline style", () => {
      expect(mountBody().getAttribute("style") ?? "").toBe("");
    });

    it("takes a plain class rule", () => {
      consumerRule(".cui-modal-body__content { padding-top: 13px; font-size: 21px; color: rgb(19, 19, 19); }");
      const content = mountBody();
      expect(css(content, "padding-top")).toBe("13px");
      expect(css(content, "font-size")).toBe("21px");
      expect(css(content, "color")).toBe("rgb(19, 19, 19)");
    });

    it("takes the public tokens from a container", () => {
      const content = mountBody("--cui-modal-body-px: 17px; --cui-modal-body-py: 9px; --cui-modal-body-font-size: 19px; --cui-modal-body-color: rgb(62, 62, 62)");
      expect(css(content, "padding-left")).toBe("17px");
      expect(css(content, "padding-top")).toBe("9px");
      expect(css(content, "padding-bottom")).toBe("9px");
      expect(css(content, "font-size")).toBe("19px");
      expect(css(content, "color")).toBe("rgb(62, 62, 62)");
    });

    it("noPadding stays flush against a consumer rule and the padding tokens", () => {
      consumerRule(".cui-modal-body__content { padding: 11px; }");
      const content = mountBody("--cui-modal-body-px: 17px; --cui-modal-body-py: 9px", { noPadding: true });
      expect(css(content, "padding-left")).toBe("0px");
      expect(css(content, "padding-top")).toBe("0px");
    });
  });

  describe("CuiModalFooter", () => {
    const mountFooter = (hostStyle = "", props: Record<string, unknown> = {}) =>
      render(CuiModalFooter, props, hostStyle, { default: () => [h("b", "A"), h("b", "B")] }).querySelector<HTMLElement>(".cui-modal-footer")!;

    it("writes no inline style", () => {
      expect(mountFooter().getAttribute("style") ?? "").toBe("");
    });

    it("takes a plain class rule, justification included", () => {
      consumerRule(".cui-modal-footer { background: rgb(9, 9, 9); padding-bottom: 13px; gap: 3px; justify-content: center; }");
      const footer = mountFooter();
      expect(css(footer, "background-color")).toBe("rgb(9, 9, 9)");
      expect(css(footer, "padding-bottom")).toBe("13px");
      expect(css(footer, "column-gap")).toBe("3px");
      expect(css(footer, "justify-content")).toBe("center");
    });

    it("takes the public tokens from a container, and `align` still decides the justification", () => {
      const footer = mountFooter("--cui-modal-footer-bg: rgb(61, 61, 61); --cui-modal-footer-gap: 5px; --cui-modal-footer-px: 17px", { align: "between" });
      expect(css(footer, "background-color")).toBe("rgb(61, 61, 61)");
      expect(css(footer, "column-gap")).toBe("5px");
      expect(css(footer, "padding-left")).toBe("17px");
      expect(css(footer, "justify-content")).toBe("space-between");
    });
  });

  describe("CuiConfirmDialog", () => {
    async function open(props: Record<string, unknown> = {}) {
      dom.track(mount(CuiConfirmDialog, { props: { visible: true, title: "Delete it?", message: "Gone for good.", confirmWord: "x", ...props } }));
      await frames(2);
      const q = (sel: string) => document.querySelector<HTMLElement>(`.cui-confirm-dialog ${sel}`)!;
      return q;
    }

    it("writes only private properties inline", async () => {
      const q = await open();
      expect(inlineNames(q(".cui-confirm-dialog__icon"))).toEqual(["--_confirm-dialog-bg", "--_confirm-dialog-border", "--_confirm-dialog-color"]);
      expect(inlineNames(q(".cui-confirm-dialog__prompt"))).toEqual(["--_confirm-dialog-bg", "--_confirm-dialog-border"]);
      for (const part of ["header", "main", "title", "message", "close", "actions"]) {
        expect(q(`.cui-confirm-dialog__${part}`).getAttribute("style") ?? "", part).toBe("");
      }
    });

    it("tints the icon tile and the prompt from the variant", async () => {
      const probe = document.createElement("div");
      probe.style.cssText = "background: var(--cui-warning-bg); color: var(--cui-warning); border: 1px solid var(--cui-warning-border)";
      document.body.append(probe);
      const q = await open({ variant: "warning" });
      for (const part of [".cui-confirm-dialog__icon", ".cui-confirm-dialog__prompt"]) {
        expect(css(q(part), "background-color"), part).toBe(css(probe, "background-color"));
        expect(css(q(part), "border-top-color"), part).toBe(css(probe, "border-top-color"));
      }
      expect(css(q(".cui-confirm-dialog__icon"), "color")).toBe(css(probe, "color"));
      probe.remove();
    });

    it("takes a plain class rule on every part", async () => {
      consumerRule(`
        .cui-confirm-dialog__header { padding-top: 13px; gap: 3px; }
        .cui-confirm-dialog__icon { border-radius: 4px; background: rgb(9, 9, 9); color: rgb(19, 19, 19); border: 3px solid rgb(29, 29, 29); }
        .cui-confirm-dialog__title { color: rgb(39, 39, 39); font-size: 21px; }
        .cui-confirm-dialog__message { color: rgb(49, 49, 49); font-size: 15px; }
        .cui-confirm-dialog__close { color: rgb(59, 59, 59); border-radius: 9px; }
        .cui-confirm-dialog__prompt { background: rgb(69, 69, 69); font-size: 17px; }
        .cui-confirm-dialog__actions { gap: 7px; }
      `);
      const q = await open();
      expect(css(q(".cui-confirm-dialog__header"), "padding-top")).toBe("13px");
      expect(css(q(".cui-confirm-dialog__header"), "column-gap")).toBe("3px");
      expect(css(q(".cui-confirm-dialog__icon"), "border-top-left-radius")).toBe("4px");
      expect(css(q(".cui-confirm-dialog__icon"), "background-color")).toBe("rgb(9, 9, 9)");
      expect(css(q(".cui-confirm-dialog__icon"), "color")).toBe("rgb(19, 19, 19)");
      expect(css(q(".cui-confirm-dialog__icon"), "border-top-width")).toBe("3px");
      expect(css(q(".cui-confirm-dialog__title"), "color")).toBe("rgb(39, 39, 39)");
      expect(css(q(".cui-confirm-dialog__title"), "font-size")).toBe("21px");
      expect(css(q(".cui-confirm-dialog__message"), "color")).toBe("rgb(49, 49, 49)");
      expect(css(q(".cui-confirm-dialog__message"), "font-size")).toBe("15px");
      expect(css(q(".cui-confirm-dialog__close"), "color")).toBe("rgb(59, 59, 59)");
      expect(css(q(".cui-confirm-dialog__close"), "border-top-left-radius")).toBe("9px");
      expect(css(q(".cui-confirm-dialog__prompt"), "background-color")).toBe("rgb(69, 69, 69)");
      expect(css(q(".cui-confirm-dialog__prompt"), "font-size")).toBe("17px");
      expect(css(q(".cui-confirm-dialog__actions"), "column-gap")).toBe("7px");
    });

    it("takes the public tokens from a container", async () => {
      document.body.setAttribute(
        "style",
        [
          "--cui-confirm-dialog-bg: rgb(61, 61, 61)",
          "--cui-confirm-dialog-border: rgb(62, 62, 62)",
          "--cui-confirm-dialog-color: rgb(63, 63, 63)",
          "--cui-confirm-dialog-gap: 5px",
          "--cui-confirm-dialog-px: 17px",
        ].join(";"),
      );
      const q = await open();
      const icon = q(".cui-confirm-dialog__icon");
      expect(css(icon, "background-color")).toBe("rgb(61, 61, 61)");
      expect(css(icon, "border-top-color")).toBe("rgb(62, 62, 62)");
      expect(css(icon, "color")).toBe("rgb(63, 63, 63)");
      const prompt = q(".cui-confirm-dialog__prompt");
      expect(css(prompt, "background-color")).toBe("rgb(61, 61, 61)");
      expect(css(prompt, "border-top-color")).toBe("rgb(62, 62, 62)");
      expect(css(q(".cui-confirm-dialog__header"), "column-gap")).toBe("5px");
      expect(css(q(".cui-confirm-dialog__header"), "padding-left")).toBe("17px");
    });
  });
});
