import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import CuiDataGrid from "../CuiDataGrid.vue";
import { __clearWarned } from "../../utils/devWarn";
import type { DataGridColumnDef } from "../../types/data-grid";

/** #485 — a frozen column without a width warns once per key, in development only. */
describe("CuiDataGrid: frozen column without a width", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  const env = process.env.NODE_ENV;
  beforeEach(() => {
    __clearWarned();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    if (env === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = env;
  });

  const mountGrid = (columns: DataGridColumnDef[]) =>
    mount(CuiDataGrid, { props: { columns, data: [{ id: "1", a: 1, b: 2 }], hideToolbar: true, hidePagination: true } });
  const frozenWarnings = () => warn.mock.calls.filter((c: unknown[]) => String(c[0]).includes("has no usable width"));

  it("warns once per column key, naming it", () => {
    mountGrid([{ key: "a", label: "A", sticky: true }, { key: "b", label: "B", sticky: true }, { key: "c", label: "C", sticky: true, width: "90px" }]);
    mountGrid([{ key: "a", label: "A", sticky: true }, { key: "c", label: "C", sticky: true, width: "90px" }]);
    const messages = frozenWarnings().map((c: unknown[]) => String(c[0]));
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('"a"');
    expect(messages[1]).toContain('"b"');
  });

  it("is silent when every frozen column has a width", () => {
    mountGrid([{ key: "a", label: "A", sticky: true, width: "100px" }, { key: "b", label: "B" }]);
    expect(frozenWarnings()).toHaveLength(0);
  });

  it("warns for an unusable declared width, but not for the last frozen column", () => {
    mountGrid([
      { key: "a", label: "A", sticky: true, width: "auto" },
      { key: "b", label: "B", sticky: true },
    ]);
    const messages = frozenWarnings().map((c: unknown[]) => String(c[0]));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('"a"');
  });

  it("is silent in production", () => {
    process.env.NODE_ENV = "production";
    mountGrid([{ key: "a", label: "A", sticky: true }, { key: "b", label: "B", sticky: true, width: "90px" }]);
    expect(frozenWarnings()).toHaveLength(0);
  });
});
