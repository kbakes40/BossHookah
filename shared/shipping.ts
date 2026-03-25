/**
 * Boss Hookah — shared shipping calculation (cart, PayPal, Zelle, Stripe).
 */

export const FREE_SHIPPING_THRESHOLD_USD = 100;

export const DEFAULT_WEIGHT_LB_PER_ITEM = 1;

/** Weight tiers: rate applies when total cart shipping weight is <= maxWeight (lb). Last tier should use Infinity. */
export const SHIPPING_RATES_BY_MAX_LB: ReadonlyArray<{ maxWeight: number; rate: number }> = [
  { maxWeight: 1, rate: 8.99 },
  { maxWeight: 3, rate: 12.99 },
  { maxWeight: 5, rate: 16.99 },
  { maxWeight: 10, rate: 22.99 },
  { maxWeight: Infinity, rate: 29.99 },
];

export type ShippingCartLine = {
  quantity: number;
  /** Per unit weight in pounds; if missing, `fallbackWeightLbPerUnit` is used. */
  weightLb?: number | null;
};

export type ShippingAddressInput = {
  zip?: string;
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type ShippingQuote = {
  shippingAmount: number;
  /** True when delivery is shipping and subtotal qualifies for free shipping (>= threshold). */
  isFreeShipping: boolean;
  /** Dollars still needed to reach free shipping; 0 if already qualified. */
  remainingForFreeShipping: number;
  totalWeightLb: number;
  /** True when we do not have enough address info to call it “final” (still show weight-based estimate). */
  isEstimated: boolean;
  /** Optional short label for UI, e.g. estimated notice. */
  estimatedShippingText: string | null;
};

export function rateForTotalWeightLb(totalLb: number): number {
  const w = Math.max(0, totalLb);
  for (const tier of SHIPPING_RATES_BY_MAX_LB) {
    if (w <= tier.maxWeight) return tier.rate;
  }
  return SHIPPING_RATES_BY_MAX_LB[SHIPPING_RATES_BY_MAX_LB.length - 1]!.rate;
}

function hasMeaningfulAddress(address?: ShippingAddressInput | null): boolean {
  if (!address) return false;
  const z = address.zip?.trim();
  const line = address.line1?.trim();
  return Boolean(z || line);
}

/**
 * Compute shipping for the cart. Pickup always returns $0 shipping.
 * Subtotal >= FREE_SHIPPING_THRESHOLD_USD with shipping delivery → $0 (free).
 * Otherwise use total weight (per-line weight × qty, fallback per unit) and tiered rates.
 */
export function calculateShipping(params: {
  subtotal: number;
  deliveryMethod: "shipping" | "pickup";
  lines: ShippingCartLine[];
  address?: ShippingAddressInput | null;
  /** Defaults to {@link DEFAULT_WEIGHT_LB_PER_ITEM}. */
  fallbackWeightLbPerUnit?: number;
  /** Defaults to {@link FREE_SHIPPING_THRESHOLD_USD}. */
  freeShippingThresholdUsd?: number;
}): ShippingQuote {
  const threshold = params.freeShippingThresholdUsd ?? FREE_SHIPPING_THRESHOLD_USD;
  const fallbackUnit = params.fallbackWeightLbPerUnit ?? DEFAULT_WEIGHT_LB_PER_ITEM;
  const subtotal = Math.max(0, params.subtotal);
  const remainingForFreeShipping =
    subtotal >= threshold ? 0 : Math.max(0, threshold - subtotal);

  if (params.deliveryMethod === "pickup") {
    return {
      shippingAmount: 0,
      isFreeShipping: false,
      remainingForFreeShipping,
      totalWeightLb: 0,
      isEstimated: false,
      estimatedShippingText: null,
    };
  }

  const isFreeShipping = subtotal >= threshold;
  const totalWeightLb = params.lines.reduce((sum, line) => {
    const unit =
      line.weightLb != null && Number.isFinite(line.weightLb) && line.weightLb > 0
        ? line.weightLb
        : fallbackUnit;
    return sum + unit * Math.max(0, line.quantity);
  }, 0);

  const weightForRate = totalWeightLb > 0 ? totalWeightLb : fallbackUnit * 0; // empty cart → 0 lb → still pick tier
  const tierRate = rateForTotalWeightLb(
    params.lines.length === 0 ? 0 : weightForRate > 0 ? weightForRate : fallbackUnit
  );

  const shippingAmount = isFreeShipping
    ? 0
    : Number(tierRate.toFixed(2));

  const addrOk = hasMeaningfulAddress(params.address);
  const isEstimated = !addrOk;
  const estimatedShippingText = isEstimated
    ? "Estimated from cart weight. Add ZIP or full address to confirm."
    : null;

  return {
    shippingAmount,
    isFreeShipping,
    remainingForFreeShipping,
    totalWeightLb: Number(totalWeightLb.toFixed(2)),
    isEstimated,
    estimatedShippingText,
  };
}

export function orderGrandTotalUsd(subtotal: number, shippingQuote: ShippingQuote): number {
  return Number((subtotal + shippingQuote.shippingAmount).toFixed(2));
}
