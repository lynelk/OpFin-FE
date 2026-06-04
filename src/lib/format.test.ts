import { describe, expect, it } from "vitest";
import { formatUgx, maskSensitiveId } from "./format";

describe("formatUgx", () => {
  it("formats a typical loan amount with thousands separator", () => {
    const result = formatUgx(250_000);
    expect(result).toContain("250,000");
  });

  it("treats undefined as zero", () => {
    const result = formatUgx(undefined);
    expect(result).toContain("0");
  });

  it("coerces a string amount", () => {
    const result = formatUgx("1000000");
    expect(result).toContain("1,000,000");
  });

  it("formats zero without decimals", () => {
    const result = formatUgx(0);
    expect(result).not.toContain(".");
  });
});

describe("maskSensitiveId", () => {
  it("preserves first and last 2 characters of a NIN", () => {
    const masked = maskSensitiveId("CM1234567890");
    expect(masked.startsWith("CM")).toBe(true);
    expect(masked.endsWith("90")).toBe(true);
  });

  it("replaces all middle characters with asterisks", () => {
    const masked = maskSensitiveId("CM1234567890");
    const middle = masked.slice(2, -2);
    expect(middle).toMatch(/^\*+$/);
  });

  it("returns Not available for null", () => {
    expect(maskSensitiveId(null)).toBe("Not available");
  });

  it("returns Not available for undefined", () => {
    expect(maskSensitiveId(undefined)).toBe("Not available");
  });

  it("masks a value of 4 or fewer characters entirely", () => {
    expect(maskSensitiveId("AB")).toBe("****");
    expect(maskSensitiveId("ABCD")).toBe("****");
  });
});
