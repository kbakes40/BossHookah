/**
 * Google Analytics 4 (Data API) — server-only. Used by GET /api/admin/analytics/overview.
 */
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type {
  Ga4ConnectionTestResult,
  Ga4DailyPoint,
  Ga4DeviceRow,
  Ga4OverviewFailure,
  Ga4OverviewNotConfigured,
  Ga4OverviewResponse,
  Ga4OverviewSuccess,
  Ga4TopPage,
  Ga4TrafficSource,
} from "@shared/ga4Overview";
import { readGa4Env } from "./_core/env";

function propertyResourceName(rawId: string): string {
  const s = rawId.trim();
  if (s.startsWith("properties/")) return s;
  return `properties/${s}`;
}

/** GA4 Data API expects numeric Property ID, not the web stream Measurement ID (G-…). */
function ga4PropertyIdConfigErrorMessage(propertyId: string): string | null {
  const s = propertyId.trim();
  if (!s) return null;
  if (/^G-[A-Z0-9]+$/i.test(s)) {
    return (
      "GA4_PROPERTY_ID must be the numeric Property ID from Google Analytics → Admin → Property settings " +
      "(e.g. 123456789), not the Measurement ID (G-…). The site tag (gtag) uses G-…; the Data API uses the number."
    );
  }
  return null;
}

function numMetric(row: { metricValues?: Array<{ value?: string | null }> }, i: number): number {
  const v = row.metricValues?.[i]?.value;
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function createClient(): BetaAnalyticsDataClient {
  const { clientEmail, privateKey } = readGa4Env();
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

async function runRealtimeActiveUsers(
  client: BetaAnalyticsDataClient,
  property: string
): Promise<number> {
  const [resp] = await client.runRealtimeReport({
    property,
    metrics: [{ name: "activeUsers" }],
  });
  const row = resp.rows?.[0];
  if (!row) return 0;
  return numMetric(row, 0);
}

/** Sum activeUsers across minute buckets 0–4 (approximation; may over-count). */
async function runRealtimeActiveUsersApprox5Min(
  client: BetaAnalyticsDataClient,
  property: string
): Promise<number | null> {
  try {
    const [resp] = await client.runRealtimeReport({
      property,
      dimensions: [{ name: "minutesAgo" }],
      metrics: [{ name: "activeUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "minutesAgo",
          numericFilter: {
            operation: "LESS_THAN_OR_EQUAL",
            value: { int64Value: "4" },
          },
        },
      },
    });
    const rows = resp.rows ?? [];
    if (rows.length === 0) return null;
    let sum = 0;
    for (const row of rows) {
      sum += numMetric(row, 0);
    }
    return sum;
  } catch {
    return null;
  }
}

async function runTopPages(
  client: BetaAnalyticsDataClient,
  property: string
): Promise<Ga4TopPage[]> {
  const [resp] = await client.runReport({
    property,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ desc: true, metric: { metricName: "screenPageViews" } }],
    limit: 15,
  });
  const out: Ga4TopPage[] = [];
  for (const row of resp.rows ?? []) {
    const path = row.dimensionValues?.[0]?.value ?? "";
    const title = row.dimensionValues?.[1]?.value ?? null;
    out.push({ pagePath: path, pageTitle: title, views: numMetric(row, 0) });
  }
  return out;
}

async function runTrafficSources(
  client: BetaAnalyticsDataClient,
  property: string
): Promise<Ga4TrafficSource[]> {
  const [resp] = await client.runReport({
    property,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ desc: true, metric: { metricName: "sessions" } }],
    limit: 12,
  });
  const out: Ga4TrafficSource[] = [];
  for (const row of resp.rows ?? []) {
    const channel = row.dimensionValues?.[0]?.value ?? "(other)";
    out.push({ channel, sessions: numMetric(row, 0) });
  }
  return out;
}

async function runDeviceBreakdown(
  client: BetaAnalyticsDataClient,
  property: string
): Promise<Ga4DeviceRow[]> {
  const [resp] = await client.runReport({
    property,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ desc: true, metric: { metricName: "activeUsers" } }],
    limit: 10,
  });
  const out: Ga4DeviceRow[] = [];
  for (const row of resp.rows ?? []) {
    const category = row.dimensionValues?.[0]?.value ?? "unknown";
    out.push({ category, users: numMetric(row, 0) });
  }
  return out;
}

function formatGaDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

async function runDailyTrend(
  client: BetaAnalyticsDataClient,
  property: string
): Promise<Ga4DailyPoint[]> {
  const [resp] = await client.runReport({
    property,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: 14,
  });
  const out: Ga4DailyPoint[] = [];
  for (const row of resp.rows ?? []) {
    const d = row.dimensionValues?.[0]?.value ?? "";
    out.push({
      date: formatGaDate(d),
      users: numMetric(row, 0),
      sessions: numMetric(row, 1),
    });
  }
  return out;
}

const NOT_CONFIGURED: Ga4OverviewNotConfigured = {
  ok: true,
  configured: false,
  message:
    "Google Analytics is not connected. Add GA4_PROPERTY_ID (numeric Property ID from GA4 Admin — not G-…), GA4_CLIENT_EMAIL, and GA4_PRIVATE_KEY to your server environment (e.g. Vercel Production). Grant the service account Viewer on the GA4 property. Set VITE_GA_MEASUREMENT_ID to your G-… stream and redeploy so the site tag and API read the same property.",
};

/**
 * Lightweight GA4 Data API call for credential / property verification.
 * Caller must enforce admin-only HTTP access.
 */
export async function testGa4Connection(): Promise<Ga4ConnectionTestResult> {
  const env = readGa4Env();
  const propertyIdRaw = env.propertyId || null;

  if (!env.propertyId || !env.clientEmail || !env.privateKey) {
    return {
      connected: false,
      propertyId: propertyIdRaw,
      error: "Missing GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, or GA4_PRIVATE_KEY",
    };
  }

  const idMsg = ga4PropertyIdConfigErrorMessage(env.propertyId);
  if (idMsg) {
    return { connected: false, propertyId: propertyIdRaw, error: idMsg };
  }

  const property = propertyResourceName(env.propertyId);
  const checkedAt = new Date().toISOString();

  try {
    const client = createClient();
    const realtimeActiveUsers = await runRealtimeActiveUsers(client, property);
    return {
      connected: true,
      propertyId: env.propertyId.trim(),
      realtimeActiveUsers,
      checkedAt,
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[GA4] testGa4Connection", error);
    return {
      connected: false,
      propertyId: propertyIdRaw,
      error,
    };
  }
}

/**
 * Fetches GA4 overview for the admin dashboard. No auth — caller must restrict to admins.
 */
export async function fetchGa4Overview(): Promise<Ga4OverviewResponse> {
  const env = readGa4Env();
  if (!env.propertyId || !env.clientEmail || !env.privateKey) {
    return NOT_CONFIGURED;
  }

  const fetchedAt = new Date().toISOString();
  const idMsg = ga4PropertyIdConfigErrorMessage(env.propertyId);
  if (idMsg) {
    const err: Ga4OverviewFailure = {
      ok: false,
      configured: true,
      error: idMsg,
      fetchedAt,
    };
    return err;
  }

  const property = propertyResourceName(env.propertyId);
  let client: BetaAnalyticsDataClient;
  try {
    client = createClient();
  } catch (e) {
    const err: Ga4OverviewFailure = {
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : "Failed to initialize GA4 client",
      fetchedAt,
    };
    return err;
  }

  try {
    const [activeUsersRealtime, activeUsersApprox5Minutes, topPages, topSources, deviceBreakdown, dailyTrend] =
      await Promise.all([
        runRealtimeActiveUsers(client, property),
        runRealtimeActiveUsersApprox5Min(client, property),
        runTopPages(client, property),
        runTrafficSources(client, property),
        runDeviceBreakdown(client, property),
        runDailyTrend(client, property),
      ]);

    const success: Ga4OverviewSuccess = {
      ok: true,
      configured: true,
      fetchedAt,
      activeUsersRealtime,
      activeUsersApprox5Minutes,
      topPages,
      topSources,
      deviceBreakdown,
      dailyTrend,
    };
    return success;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[GA4] fetchGa4Overview", msg);
    const err: Ga4OverviewFailure = {
      ok: false,
      configured: true,
      error: msg,
      fetchedAt,
    };
    return err;
  }
}
