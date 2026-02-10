/**
 * Stripe Integration - Webhook Handler and Checkout Session Creation
 */

import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { orders, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

if (!ENV.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2026-01-28.clover",
});

/**
 * Create a Stripe Checkout Session for product purchase
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  items: Array<{ name: string; priceInCents: number; quantity: number; image?: string }>;
  deliveryMethod: "shipping" | "pickup";
  successUrl: string;
  cancelUrl: string;
}) {
  const { userId, userEmail, userName, items, deliveryMethod, successUrl, cancelUrl } = params;
  console.log('[Stripe] Creating checkout session:', { userId, userEmail, itemCount: items.length });

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);

  // Create line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
    // Validate image URL - Stripe requires absolute URLs starting with http:// or https://
    let validImageUrl: string | undefined = undefined;
    if (item.image) {
      try {
        const url = new URL(item.image, 'https://example.com'); // Use base URL for relative paths
        // Only use if it's an absolute URL with http/https protocol
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          validImageUrl = item.image.startsWith('http') ? item.image : undefined;
        }
      } catch (e) {
        console.warn('[Stripe] Invalid image URL for item:', item.name, item.image);
      }
    }

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: validImageUrl ? [validImageUrl] : undefined,
        },
        unit_amount: item.priceInCents,
      },
      quantity: item.quantity,
    };
  });

  // Create checkout session
  console.log('[Stripe] Calling Stripe API with line items:', lineItems.length);
  console.log('[Stripe] Delivery method:', deliveryMethod);
  console.log('[Stripe] Success URL:', `${successUrl}?session_id={CHECKOUT_SESSION_ID}&delivery_method=${deliveryMethod}`);
  
  try {
    const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&delivery_method=${deliveryMethod}`,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      items: JSON.stringify(items),
      delivery_method: deliveryMethod,
    },
    allow_promotion_codes: true,
  });

    console.log('[Stripe] Checkout session created:', session.id, session.url);
    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
    if (error instanceof Error) {
      console.error('[Stripe] Error message:', error.message);
      console.error('[Stripe] Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return { success: false, error: "Database unavailable" };
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return { verified: true };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract metadata
        const userId = parseInt(session.metadata?.user_id || session.client_reference_id || "0");
        const items = session.metadata?.items || "[]";
        
        if (!userId) {
          console.error("[Stripe Webhook] No user ID found in session metadata");
          break;
        }

        // Get customer name from session
        let customerName: string | null = null;
        if (session.customer_details?.name) {
          customerName = session.customer_details.name;
        }

        // Get delivery method from metadata
        const deliveryMethod = (session.metadata?.delivery_method as "shipping" | "pickup") || "shipping";

        // Create order record
        await db.insert(orders).values({
          userId,
          stripePaymentIntentId: session.payment_intent as string,
          stripeCheckoutSessionId: session.id,
          customerName,
          deliveryMethod,
          status: "paid",
          totalAmount: session.amount_total || 0,
          currency: session.currency || "usd",
          items,
          shippingAddress: null, // Shipping details can be retrieved from PaymentIntent if needed
        });

        // Update user's Stripe customer ID if available
        if (session.customer) {
          await db
            .update(users)
            .set({ stripeCustomerId: session.customer as string })
            .where(eq(users.id, userId));
        }

        console.log(`[Stripe Webhook] Order created for user ${userId}, session ${session.id}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update order status
        await db
          .update(orders)
          .set({ status: "paid" })
          .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

        console.log(`[Stripe Webhook] Payment succeeded for intent ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update order status
        await db
          .update(orders)
          .set({ status: "failed" })
          .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

        console.log(`[Stripe Webhook] Payment failed for intent ${paymentIntent.id}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        
        // Update order status
        if (charge.payment_intent) {
          await db
            .update(orders)
            .set({ status: "refunded" })
            .where(eq(orders.stripePaymentIntentId, charge.payment_intent as string));

          console.log(`[Stripe Webhook] Charge refunded for intent ${charge.payment_intent}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    return { success: false, error: String(error) };
  }
}
