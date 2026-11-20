import { describe, expect, it } from "vitest";
import {
  add, apportion, compare, div, mul, parseFraction, rational, sub, sum, toNumber, toString,
} from "@/lib/rational";

describe("exact rational arithmetic", () => {
  it("normalizes fractions", () => {
    expect(toString(rational(4n, 8n))).toBe("1/2");
    expect(toString(rational(-2n, 4n))).toBe("-1/2");
    expect(toString(rational(3n, -6n))).toBe("-1/2");
  });

  it("adds and subtracts exactly", () => {
    expect(toString(add(rational(1n, 2n), rational(1n, 3n)))).toBe("5/6");
    expect(toString(sub(rational(1n, 2n), rational(1n, 3n)))).toBe("1/6");
  });

  it("multiplies and divides", () => {
    expect(toString(mul(rational(2n, 3n), rational(3n, 4n)))).toBe("1/2");
    expect(toString(div(rational(1n, 2n), rational(1n, 4n)))).toBe("2");
  });

  it("sums fixed shares with Awl case", () => {
    // 1/4 husband + 2/3 two daughters + 1/6 mother = 13/12
    const total = sum([rational(1n, 4n), rational(2n, 3n), rational(1n, 6n)]);
    expect(toString(total)).toBe("13/12");
    expect(compare(total, rational(1n))).toBe(1);
  });

  it("apportions exactly with largest remainder", () => {
    const result = apportion([rational(1n, 3n), rational(1n, 3n), rational(1n, 3n)], 100n);
    expect(result.reduce((a, b) => a + b, 0n)).toBe(100n);
    expect(result).toEqual([34n, 33n, 33n]);
  });

  it("parses fraction strings", () => {
    expect(toString(parseFraction("2/3"))).toBe("2/3");
    expect(toNumber(parseFraction("1/4"))).toBe(0.25);
  });

  it("throws on zero denominator", () => {
    expect(() => rational(1n, 0n)).toThrow();
  });
});
