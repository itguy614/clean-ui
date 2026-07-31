import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { version } from "../version";

describe("version", () => {
  it("matches package.json exactly", () => {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf-8"));
    expect(version).toBe(pkg.version);
  });
});
