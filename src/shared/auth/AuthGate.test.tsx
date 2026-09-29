import { describe, expect, it } from "vitest";
import { safeNextPath } from "./AuthGate";

describe("safeNextPath", () => {
  it("пропускает внутренние пути", () => {
    expect(safeNextPath("/finance")).toBe("/finance");
  });

  it("не уводит на чужие сайты", () => {
    expect(safeNextPath("//evil.com")).toBe("/home");
    expect(safeNextPath("https://evil.com")).toBe("/home");
    expect(safeNextPath(null)).toBe("/home");
  });
});
