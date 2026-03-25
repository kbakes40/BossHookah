/**
 * Boss Hookah — display currency conversion (fixed rates, single source of truth).
 * Catalog amounts, cart, and payment APIs remain USD; this module is for UI display only.
 */

export type ShopCurrencyId = "usd" | "cad" | "gbp";

export const SHOP_CURRENCY_STORAGE_KEY = "bh_shop_currency";

/**
 * Multiply a USD amount by this to get display currency units.
 * USD = 1. Update CAD/GBP manually when you want refreshed static rates.
 */
export const USD_TO_DISPLAY_RATE: Record<ShopCurrencyId, number> = {
  usd: 1,
  cad: 1.38,
  gbp: 0.79,
};

export function isShopCurrencyId(value: string): value is ShopCurrencyId {
  return value === "usd" || value === "cad" || value === "gbp";
}

export function convertUsdToDisplayAmount(usd: number, currency: ShopCurrencyId): number {
  const rate = USD_TO_DISPLAY_RATE[currency];
  const n = (Number.isFinite(usd) ? usd : 0) * rate;
  return Math.round(Math.max(0, n) * 100) / 100;
}

/** Format already-converted display units (subtotal/shipping legs after conversion). */
export function formatDisplayUnitAmount(amountInDisplayUnits: number, currency: ShopCurrencyId): string {
  const v = Math.round(amountInDisplayUnits * 100) / 100;
  if (currency === "usd") return `$${v.toFixed(2)}`;
  if (currency === "cad") return `CA$${v.toFixed(2)}`;
  return `£${v.toFixed(2)}`;
}

/** Format a USD base amount in the selected display currency. */
export function formatDisplayMoney(usd: number, currency: ShopCurrencyId): string {
  return formatDisplayUnitAmount(convertUsdToDisplayAmount(usd, currency), currency);
}

/**
 * Subtotal/shipping legs and total in display units, with total = round(sub + ship) so rows reconcile.
 */
export function displayTotalsFromUsd(
  subtotalUsd: number,
  shippingUsd: number,
  currency: ShopCurrencyId
): { subtotal: number; shipping: number; total: number } {
  const subtotal = convertUsdToDisplayAmount(subtotalUsd, currency);
  const shipping = convertUsdToDisplayAmount(shippingUsd, currency);
  const total = Math.round((subtotal + shipping) * 100) / 100;
  return { subtotal, shipping, total };
}

export function formatDisplayTotalsFromUsd(
  subtotalUsd: number,
  shippingUsd: number,
  currency: ShopCurrencyId
): { subtotal: string; shipping: string; total: string } {
  const { subtotal, shipping, total } = displayTotalsFromUsd(subtotalUsd, shippingUsd, currency);
  return {
    subtotal: formatDisplayUnitAmount(subtotal, currency),
    shipping: formatDisplayUnitAmount(shipping, currency),
    total: formatDisplayUnitAmount(total, currency),
  };
}
