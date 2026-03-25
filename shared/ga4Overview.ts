/**
 * GA4 admin overview payload (server-computed, exposed only to admins via /api/admin/analytics/overview).
 */

export type Ga4TopPage = {
  pagePath: string;
  pageTitle: string | null;
  views: number;
};

export type Ga4TrafficSource = {
  channel: string;
  sessions: number;
};

export type Ga4DeviceRow = {
  category: string;
  users: number;
};

export type Ga4DailyPoint = {
  date: string;
  users: number;
  sessions: number;
};

/** Successful load with live GA4 data */
export type Ga4OverviewSuccess = {
  ok: true;
  configured: true;
  fetchedAt: string;
  /** GA4 Realtime API `activeUsers` (includes visitors in the last ~30 minutes per Google). */
  activeUsersRealtime: number;
  /**
   * Approximation: sum of `activeUsers` across realtime rows with minutesAgo 0–4 (may over-count).
   * `null` if unavailable.
   */
  activeUsersApprox5Minutes: number | null;
  topPages: Ga4TopPage[];
  topSources: Ga4TrafficSource[];
  deviceBreakdown: Ga4DeviceRow[];
  dailyTrend: Ga4DailyPoint[];
};

export type Ga4OverviewNotConfigured = {
  ok: true;
  configured: false;
  message: string;
};

export type Ga4OverviewFailure = {
  ok: false;
  configured: true;
  error: string;
  fetchedAt: string;
};

export type Ga4OverviewResponse = Ga4OverviewSuccess | Ga4OverviewNotConfigured | Ga4OverviewFailure;
