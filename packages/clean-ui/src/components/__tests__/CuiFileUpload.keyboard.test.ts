import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import CuiFileUpload from "../CuiFileUpload.vue";

/**
 * #169 — the file input was display:none and the drop zone a click-only div, so there was
 * no keyboard path to the file dialog; focus() did nothing, and the remove buttons and the
 * label named nothing.
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

const input = () => w!.find('input[type="file"]').element as HTMLInputElement;

function addFile(name = "report.pdf") {
  const file = new File(["x"], name, { type: "application/pdf" });
  Object.defineProperty(input(), "files", { value: [file], configurable: true });
  input().dispatchEvent(new Event("change"));
}

describe("CuiFileUpload keyboard and naming", () => {
  it("keeps the file input in the tab order, visually hidden rather than display:none", () => {
    w = mount(CuiFileUpload, { attachTo: document.body });
    expect(input().classList.contains("cui-sr-only")).toBe(true);
    expect(input().style.display).not.toBe("none");
    expect(input().tabIndex).toBe(0);
  });

  it("makes the drop zone and the label prop <label>s for the input", () => {
    w = mount(CuiFileUpload, { props: { label: "Attachments" }, attachTo: document.body });
    const labels = w.findAll("label");
    expect(labels).toHaveLength(2);
    expect(labels.every((l) => l.attributes("for") === input().id)).toBe(true);
    expect(input().labels).toHaveLength(2);
  });

  it("honours a consumer id", () => {
    w = mount(CuiFileUpload, { props: { id: "docs" }, attachTo: document.body });
    expect(input().id).toBe("docs");
    expect(w.find(".cui-file-upload__zone").attributes("for")).toBe("docs");
  });

  it("describes the input with the accept and size hint, after the consumer's descriptions", () => {
    w = mount(CuiFileUpload, { props: { accept: ".pdf", maxFileSize: 1024, ariaDescribedby: "help" }, attachTo: document.body });
    const [first, hint] = input().getAttribute("aria-describedby")!.split(" ");
    expect(first).toBe("help");
    expect(document.getElementById(hint)?.textContent).toContain(".pdf");
  });

  it("focus() focuses the input", () => {
    w = mount(CuiFileUpload, { attachTo: document.body });
    (w.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(input());
  });

  it("names each file's remove button", async () => {
    w = mount(CuiFileUpload, { attachTo: document.body });
    addFile("report.pdf");
    await w.vm.$nextTick();
    expect(w.find(".cui-file-upload__remove").attributes("aria-label")).toBe("Remove report.pdf");
  });

  it("disables the input and the list's buttons when disabled", async () => {
    w = mount(CuiFileUpload, { attachTo: document.body });
    addFile();
    await w.setProps({ disabled: true });
    expect(input().disabled).toBe(true);
    expect((w.find(".cui-file-upload__remove").element as HTMLButtonElement).disabled).toBe(true);
    expect(w.findAll("button.cui-button").every((b) => (b.element as HTMLButtonElement).disabled)).toBe(true);
  });
});
