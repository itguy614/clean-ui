import type { FormResolver, FormErrors, FormValues } from "../components/form-context";

// Structural shapes for the validation libraries we adapt — declared locally so
// the library takes NO runtime dependency on zod/valibot. Consumers pass their
// own schema instance; we only touch its `safeParse`.

/** Minimal shape of a zod schema's `safeParse` result. */
interface ZodLikeSchema {
  safeParse: (value: unknown) => {
    success: boolean;
    error?: { issues: Array<{ path: Array<string | number>; message: string }> };
  };
}

/** Minimal shape of valibot's `safeParse(schema, value)` return. */
interface ValibotSafeParseResult {
  success: boolean;
  issues?: Array<{ message: string; path?: Array<{ key: string | number }> }>;
}

/**
 * Adapt a zod schema (or anything with a compatible `safeParse`) into a
 * `CuiForm` resolver. The first issue per field wins.
 *
 * ```ts
 * import { z } from "zod";
 * const schema = z.object({ email: z.string().email() });
 * const resolver = zodResolver(schema);
 * // <CuiForm :resolver="resolver" />
 * ```
 */
export function zodResolver(schema: ZodLikeSchema): FormResolver {
  return (values: FormValues): FormErrors => {
    const result = schema.safeParse(values);
    if (result.success || !result.error) return {};
    const errors: FormErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path && !(path in errors)) errors[path] = issue.message;
    }
    return errors;
  };
}

/**
 * Adapt valibot's `safeParse` into a `CuiForm` resolver. Pass a thunk that runs
 * `safeParse(schema, values)` so this stays dependency-free.
 *
 * ```ts
 * import * as v from "valibot";
 * const schema = v.object({ email: v.pipe(v.string(), v.email()) });
 * const resolver = valibotResolver((values) => v.safeParse(schema, values));
 * ```
 */
export function valibotResolver(
  run: (values: FormValues) => ValibotSafeParseResult,
): FormResolver {
  return (values: FormValues): FormErrors => {
    const result = run(values);
    if (result.success || !result.issues) return {};
    const errors: FormErrors = {};
    for (const issue of result.issues) {
      const path = (issue.path ?? []).map((p) => p.key).join(".");
      if (path && !(path in errors)) errors[path] = issue.message;
    }
    return errors;
  };
}
