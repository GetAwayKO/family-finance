import { describe, expect, it } from "vitest";
import { safeNextPath } from "./AuthGate";

describe("safeNextPath", () => {
  it("пропускает внутренние пути", () => {
    expect(safeNextPath("/transactions")).toBe("/transactions");
    expect(safeNextPath("/accounts?x=1#top")).toBe("/accounts?x=1#top");
  });

  it("не уводит на чужие сайты", () => {
    expect(safeNextPath("//evil.com")).toBe("/home");
    expect(safeNextPath("https://evil.com")).toBe("/home");
    expect(safeNextPath("/\\evil.com")).toBe("/home");
    expect(safeNextPath("/\t/evil.com")).toBe("/home");
    expect(safeNextPath(null)).toBe("/home");
  });
});
