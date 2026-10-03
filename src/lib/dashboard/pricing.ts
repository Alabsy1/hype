// Pure price helpers shared by dashboard server actions (authoritative) and
// UI previews. No server-only import by design — importable anywhere, including
// DB-free unit checks. The database always stores integer cents; formatting
// never happens inside repositories.

/** Maximum storable price: 100_000_000 cents ($1,000,000.00). */
export const MAX_PRICE_CENTS = 100_000_000;

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

export interface PriceParseResult {
  ok: boolean;
  cents: number;
  error: string | null;
}

/**
 * Converts an admin-entered decimal price ("1299.50") to integer cents using
 * integer arithmetic only — no floating point. Rejects negatives, >2 decimals,
 * non-numeric input, and values above MAX_PRICE_CENTS.
 */
export function parsePriceToCents(value: unknown): PriceParseResult {
  const fail = (error: string): PriceParseResult => ({ ok: false, cents: 0, error });
  if (typeof value !== "string") return fail("Price must be a number.");
  const trimmed = value.trim();
  if (trimmed === "") return fail("Price is required.");
  if (!PRICE_PATTERN.test(trimmed)) {
    return fail("Price must be a non-negative number with at most 2 decimals.");
  }
  const [dollarsPart, centsPart = ""] = trimmed.split(".");
  const cents = Number(dollarsPart) * 100 + Number(centsPart.padEnd(2, "0").slice(0, 2));
  if (!Number.isSafeInteger(cents)) return fail("Price is too large.");
  if (cents > MAX_PRICE_CENTS) return fail("Price exceeds the maximum allowed value.");
  return { ok: true, cents, error: null };
}

/** Formats integer cents for admin display (USD, e.g. 129950 → "$1,299.50"). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Converts integer cents back to an editable decimal string ("1299.50"). */
export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}
