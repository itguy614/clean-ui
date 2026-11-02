import { test, expectTypeOf } from "vitest";
import type CuiDataGrid from "../CuiDataGrid.vue";
import type { DataGridRow } from "../../types/data-grid";

// What a template ref to the grid sees (#372). The grid is generic, so its instance type
// is the `expose` payload vue-tsc writes onto the component function — refs already
// unwrapped, as Vue's proxy unwraps them on the instance.
type Exposed = Parameters<NonNullable<ReturnType<typeof CuiDataGrid>["__ctx"]>["expose"]>[0];

test("the exposed paging members are typed", () => {
  expectTypeOf<Exposed["processedRows"]>().toEqualTypeOf<DataGridRow[]>();
  expectTypeOf<Exposed["page"]>().toEqualTypeOf<number>();
  expectTypeOf<Exposed["lastPage"]>().toEqualTypeOf<number>();
  expectTypeOf<Exposed["setPage"]>().toEqualTypeOf<(n: number) => void>();
});
