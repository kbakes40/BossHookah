/**
 * PayPal REST API — OAuth + Orders v2 (create + capture).
 */
import { ENV } from "./_core/env";

function apiBase(): string {
  return ENV.paypalEnv === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getPayPalAccessToken(): Promise<string> {
  if (!ENV.paypalClientId || !ENV.paypalSecret) {
    throw new Error("PayPal is not configured (PAYPAL_CLIENT_ID / PAYPAL_SECRET)");
  }
  const auth = Buffer.from(`${ENV.paypalClientId}:${ENV.paypalSecret}`).toString("base64");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok) {
    console.error("[PayPal] OAuth error:", res.status, data);
    throw new Error(data.error_description || `PayPal OAuth failed (${res.status})`);
  }
  if (!data.access_token) {
    throw new Error("PayPal OAuth: missing access_token");
  }
  return data.access_token;
}

export async function paypalCreateOrder(params: {
  amount: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string | undefined }> {
  const accessToken = await getPayPalAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: params.amount,
          },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    message?: string;
    name?: string;
    details?: unknown;
    links?: Array<{ href: string; rel: string; method?: string }>;
  };

  if (!res.ok) {
    console.error("[PayPal] create order error:", res.status, data);
    const msg = data.message || data.name || JSON.stringify(data.details || data);
    throw new Error(typeof msg === "string" ? msg : "PayPal create order failed");
  }

  if (!data.id) {
    throw new Error("PayPal create order: missing id");
  }

  const approve = data.links?.find(
    l => l.rel === "approve" || l.rel === "payer-action"
  );

  return { id: data.id, approveUrl: approve?.href };
}

/** Raw capture JSON from PayPal (used for payer + amounts). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function paypalCaptureOrder(orderID: string): Promise<any> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[PayPal] capture error:", res.status, data);
    const d = data as { message?: string; details?: unknown; name?: string };
    const msg = d.message || d.name || JSON.stringify(d.details || data);
    throw new Error(typeof msg === "string" ? msg : "PayPal capture failed");
  }
  return data;
}
