/**
 * Exact rational arithmetic using BigInt.
 * Used by the inheritance engine so that no floating-point error can occur
 * in intermediate fraction calculations. Rounding is only applied at the
 * final currency stage (see `lib/formatting.ts`).
 */

export interface Rational {
  readonly n: bigint;
  readonly d: bigint;
}

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x === 0n ? 1n : x;
}

/** Create a normalized rational. Throws if denominator is zero. */
export function rational(n: bigint | number, d: bigint | number = 1): Rational {
  let numerator = typeof n === "bigint" ? n : BigInt(Math.trunc(n));
  let denominator = typeof d === "bigint" ? d : BigInt(Math.trunc(d));
  if (denominator === 0n) throw new Error("Rational: denominator cannot be zero");
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const divisor = gcd(numerator, denominator);
  return { n: numerator / divisor, d: denominator / divisor };
}

export const RATIONAL_ZERO = rational(0n);
export const RATIONAL_ONE = rational(1n);

export function add(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Rational, b: Rational): Rational {
  return rational(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Rational, b: Rational): Rational {
  return rational(a.n * b.n, a.d * b.d);
}

export function div(a: Rational, b: Rational): Rational {
  if (b.n === 0n) throw new Error("Rational: division by zero");
  return rational(a.n * b.d, a.d * b.n);
}

export function sum(values: readonly Rational[]): Rational {
  return values.reduce((acc, value) => add(acc, value), RATIONAL_ZERO);
}

export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function isZero(a: Rational): boolean {
  return a.n === 0n;
}

export function isGreaterThanOne(a: Rational): boolean {
  return compare(a, RATIONAL_ONE) > 0;
}

export function isLessThanOne(a: Rational): boolean {
  return compare(a, RATIONAL_ONE) < 0;
}

/** Multiply a rational by an integer amount without converting to float. */
export function multiplyByInteger(a: Rational, amountInMinorUnits: bigint): bigint {
  return (a.n * amountInMinorUnits) / a.d;
}

/** Convert to a JS number for display/charting only — never for calculation. */
export function toNumber(a: Rational): number {
  return Number(a.n) / Number(a.d);
}

/** Human-readable fraction string, e.g. "1/4" or "3/2". */
export function toString(a: Rational): string {
  return a.d === 1n ? a.n.toString() : `${a.n}/${a.d}`;
}

/** Parse a fraction string such as "2/3" into a Rational. */
export function parseFraction(value: string): Rational {
  const [n, d = "1"] = value.split("/");
  return rational(BigInt(n.trim()), BigInt(d.trim()));
}

/**
 * Largest-remainder apportionment: distributes `totalMinorUnits` across
 * weights so that the allocated amounts sum exactly to the total.
 * Used for the final currency rounding of heir shares.
 */
export function apportion(
  weights: readonly Rational[],
  totalMinorUnits: bigint,
): bigint[] {
  const weightSum = sum(weights);
  if (weightSum.n === 0n) throw new Error("apportion: total weight cannot be zero");

  const exact = weights.map((w) => mul(div(w, weightSum), rational(totalMinorUnits)));
  const floors = exact.map((e) => {
    const q = e.n / e.d;
    return q < 0n ? q - 1n : q;
  });
  const allocated = floors.reduce((acc, v) => acc + v, 0n);
  let remainder = totalMinorUnits - allocated;

  const order = exact
    .map((e, index) => ({
      index,
      fraction: e.n - floors[index] * e.d,
    }))
    .sort((a, b) => {
      if (a.fraction === b.fraction) return a.index - b.index;
      return a.fraction > b.fraction ? -1 : 1;
    });

  for (let i = 0; i < order.length && remainder > 0n; i += 1) {
    floors[order[i].index] += 1n;
    remainder -= 1n;
  }

  return floors;
}
