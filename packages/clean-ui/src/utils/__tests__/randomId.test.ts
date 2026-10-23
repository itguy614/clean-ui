import { describe, it, expect, vi, afterEach } from "vitest";
import { randomId } from "../randomId";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// #370 — crypto.randomUUID exists only in a secure context; on plain HTTP it's undefined.
describe("randomId", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses crypto.randomUUID where it exists", () => {
    expect(randomId()).toMatch(UUID_V4);
  });

  it("builds a v4 UUID itself on a page without randomUUID (plain HTTP)", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (a: Uint8Array) => real.getRandomValues(a) });
    const ids = new Set(Array.from({ length: 50 }, randomId));
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(ids.size).toBe(50);
  });
});
