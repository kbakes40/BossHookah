/**
 * Single source of truth for admin sales / profit calculations from bh_orders + bh_products.
 */

export type OrderItemLine = {
  name: string;
  priceInCents: number;
  quantity: number;
};

export type ProductCostRow = {
  id: string;
  name: string;
  brand: string;
  sku: string | null;
  cost: number | null;
};

export type OrderForAnalytics = {
  id: string;
  createdAt: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  items: unknown;
};

function parseItems(raw: unknown): OrderItemLine[] {
  if (raw == null) return [];
  let v: unknown = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  const out: OrderItemLine[] = [];
  for (const x of v) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : "";
    const priceInCents = typeof o.priceInCents === "number" ? o.priceInCents : 0;
    const quantity = typeof o.quantity === "number" ? o.quantity : 0;
    if (!name || quantity <= 0 || priceInCents < 0) continue;
    out.push({ name, priceInCents, quantity });
  }
  return out;
}

function scoreLineToProduct(lineName: string, p: ProductCostRow): number {
  const n = lineName.toLowerCase().trim();
  const pn = p.name.toLowerCase().trim();
  const full = `${p.brand} - ${p.name}`.toLowerCase().trim();
  let score = 0;
  if (n.includes(pn) && pn.length >= 3) score = pn.length;
  if (n.includes(full) && full.length >= score) score = full.length;
  if (pn.length >= 4 && pn.split(/\s+/).some(w => w.length > 2 && n.includes(w))) {
    score = Math.max(score, Math.min(pn.length, 20));
  }
  return score;
}

/**
 * Match order line text to the best catalog row (same logic as historical cost matching).
 * `requireCost: true` limits to rows with a known unit cost (COGS path).
 */
export function matchProductForLine(
  lineName: string,
  products: ProductCostRow[],
  options?: { requireCost?: boolean }
): ProductCostRow | null {
  const n = lineName.toLowerCase().trim();
  if (!n) return null;
  let pool = products;
  if (options?.requireCost) {
    pool = products.filter(p => p.cost != null && Number.isFinite(p.cost) && p.cost >= 0);
  }
  if (pool.length === 0) return null;
  const scored = pool.map(p => ({ p, score: scoreLineToProduct(lineName, p) }));
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score === 0) return null;
  return best.p;
}

/** Match order line name to best product unit cost (longest name match wins). */
export function unitCostForLineName(
  lineName: string,
  products: ProductCostRow[]
): number | null {
  const p = matchProductForLine(lineName, products, { requireCost: true });
  if (p == null || p.cost == null || !Number.isFinite(p.cost)) return null;
  return p.cost;
}

export type SalesReportInput = {
  orders: OrderForAnalytics[];
  products: ProductCostRow[];
};

export type SalesReportResult = {
  grossSales: number;
  refundedTotal: number;
  netSales: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number | null;
  averageOrderValue: number | null;
  orderCount: number;
  paidOrderCount: number;
  pendingOrderCount: number;
  shippingOrders: number;
  pickupOrders: number;
  /** True when some paid lines had no matching product cost */
  hasUnknownCost: boolean;
  unknownCostLineCount: number;
  series: Array<{ date: string; revenue: number; profit: number }>;
  topProducts: Array<{
    name: string;
    units: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  productProfitability: Array<{
    name: string;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPct: number | null;
  }>;
  /** Paid order line revenue grouped by matched product brand (unmatched → Other). */
  salesByBrand: Array<{ name: string; revenue: number }>;
  /** Paid order totals by fulfillment type (same rules as shipping / pickup counts). */
  revenueByDelivery: { shipping: number; pickup: number };
  /** netSales − totalCost (paid orders); uses same cost basis as grossProfit. */
  netProfitAfterRefunds: number;
};

const PAID_STATUSES = new Set(["paid", "completed", "delivered"]);
const PENDING_STATUSES = new Set(["pending"]);
const REFUND_STATUSES = new Set(["refunded"]);

function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function buildSalesReport(input: SalesReportInput): SalesReportResult {
  let grossSales = 0;
  let refundedTotal = 0;
  let totalCost = 0;
  let paidOrderCount = 0;
  let pendingOrderCount = 0;
  let shippingOrders = 0;
  let pickupOrders = 0;
  let revenueShipping = 0;
  let revenuePickup = 0;
  let hasUnknownCost = false;
  let unknownCostLineCount = 0;

  const seriesMap = new Map<string, { revenue: number; profit: number }>();
  const brandRevenue = new Map<string, number>();
  const productAgg = new Map<
    string,
    { units: number; revenue: number; cost: number }
  >();

  for (const o of input.orders) {
    const st = (o.status || "").toLowerCase();
    const totalUsd = (o.totalAmount || 0) / 100;
    const dm = (o.deliveryMethod || "").toLowerCase();

    if (REFUND_STATUSES.has(st)) {
      refundedTotal += Math.abs(totalUsd);
      continue;
    }

    if (PENDING_STATUSES.has(st)) {
      pendingOrderCount += 1;
      continue;
    }

    if (!PAID_STATUSES.has(st)) continue;

    paidOrderCount += 1;
    grossSales += totalUsd;
    if (dm === "pickup") {
      pickupOrders += 1;
      revenuePickup += totalUsd;
    } else {
      shippingOrders += 1;
      revenueShipping += totalUsd;
    }

    const lines = parseItems(o.items);
    let orderCost = 0;
    const dk = dayKey(o.createdAt);
    if (!seriesMap.has(dk)) seriesMap.set(dk, { revenue: 0, profit: 0 });
    const day = seriesMap.get(dk)!;
    day.revenue += totalUsd;

    if (lines.length === 0) {
      orderCost = 0;
      hasUnknownCost = true;
      const other = brandRevenue.get("Other") ?? 0;
      brandRevenue.set("Other", other + totalUsd);
    } else {
      for (const li of lines) {
        const rev = (li.priceInCents * li.quantity) / 100;
        const uc = unitCostForLineName(li.name, input.products);
        const lineCost = uc != null ? uc * li.quantity : null;
        if (lineCost == null) {
          hasUnknownCost = true;
          unknownCostLineCount += 1;
        } else {
          orderCost += lineCost;
        }
        const matched = matchProductForLine(li.name, input.products, { requireCost: false });
        const brandLabel =
          matched?.brand?.trim() ? matched.brand.trim() : matched ? "Uncategorized" : "Other";
        brandRevenue.set(brandLabel, (brandRevenue.get(brandLabel) ?? 0) + rev);

        const key = li.name.slice(0, 200);
        const cur = productAgg.get(key) ?? { units: 0, revenue: 0, cost: 0 };
        cur.units += li.quantity;
        cur.revenue += rev;
        if (lineCost != null) cur.cost += lineCost;
        productAgg.set(key, cur);
      }
    }

    totalCost += orderCost;
    day.profit += totalUsd - orderCost;
  }

  const netSales = grossSales - refundedTotal;
  const grossProfit = grossSales - totalCost;
  const netProfitAfterRefunds = netSales - totalCost;
  const rawMargin = grossSales > 0 ? grossProfit / grossSales : null;
  const profitMargin =
    rawMargin != null && Number.isFinite(rawMargin) ? rawMargin : null;
  const averageOrderValue = paidOrderCount > 0 ? grossSales / paidOrderCount : null;

  const series = Array.from(seriesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, revenue: v.revenue, profit: v.profit }));

  const topProducts = Array.from(productAgg.entries())
    .map(([name, v]) => ({
      name,
      units: v.units,
      revenue: v.revenue,
      cost: v.cost,
      profit: v.revenue - v.cost,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  const productProfitability = Array.from(productAgg.entries())
    .map(([name, v]) => ({
      name,
      unitsSold: v.units,
      revenue: v.revenue,
      cost: v.cost,
      profit: v.revenue - v.cost,
      marginPct: (() => {
        if (v.revenue <= 0) return null;
        const pct = ((v.revenue - v.cost) / v.revenue) * 100;
        return Number.isFinite(pct) ? pct : null;
      })(),
    }))
    .sort((a, b) => b.profit - a.profit);

  const salesByBrand = Array.from(brandRevenue.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    grossSales,
    refundedTotal,
    netSales,
    totalCost,
    grossProfit,
    profitMargin,
    averageOrderValue,
    orderCount: input.orders.length,
    paidOrderCount,
    pendingOrderCount,
    shippingOrders,
    pickupOrders,
    hasUnknownCost,
    unknownCostLineCount,
    series,
    topProducts,
    productProfitability,
    salesByBrand,
    revenueByDelivery: { shipping: revenueShipping, pickup: revenuePickup },
    netProfitAfterRefunds,
  };
}
