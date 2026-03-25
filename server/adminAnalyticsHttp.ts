import type { Request, Response } from "express";
import { fetchGa4Overview, testGa4Connection } from "./ga4AnalyticsService";
import { getTrpcUserFromExpressRequest } from "./_core/context";

/**
 * GET /api/admin/analytics/test — admin-only. Returns connection status and a minimal GA4 sample (no secrets).
 */
export async function handleAdminAnalyticsTest(req: Request, res: Response): Promise<void> {
  const user = await getTrpcUserFromExpressRequest(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const payload = await testGa4Connection();
    res.status(200).json(payload);
  } catch (e) {
    console.error("[admin analytics test]", e);
    res.status(500).json({
      connected: false,
      propertyId: null,
      error: e instanceof Error ? e.message : "Internal error",
    });
  }
}

/**
 * GET /api/admin/analytics/overview — admin-only JSON. Secured with Supabase Bearer token.
 */
export async function handleAdminAnalyticsOverview(req: Request, res: Response): Promise<void> {
  const user = await getTrpcUserFromExpressRequest(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const payload = await fetchGa4Overview();
    res.status(200).json(payload);
  } catch (e) {
    console.error("[admin analytics overview]", e);
    res.status(500).json({
      ok: false,
      configured: true,
      error: e instanceof Error ? e.message : "Internal error",
      fetchedAt: new Date().toISOString(),
    });
  }
}
