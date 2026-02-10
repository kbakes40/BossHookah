/**
 * Checkout Router - Handles Stripe checkout session creation
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { createCheckoutSession } from "./stripe";

export const checkoutRouter = router({
  createSession: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            name: z.string(),
            priceInCents: z.number(),
            quantity: z.number(),
            image: z.string().optional(),
          })
        ),
        deliveryMethod: z.enum(["shipping", "pickup"]).default("shipping"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        console.log('[Checkout] Creating session with:', {
          origin,
          userId: ctx.user?.id || 0,
          userEmail: ctx.user?.email || "",
          userName: ctx.user?.name || "Guest",
          deliveryMethod: input.deliveryMethod,
          itemCount: input.items.length,
        });
        
        const session = await createCheckoutSession({
          userId: ctx.user?.id || 0,
          userEmail: ctx.user?.email || "",
          userName: ctx.user?.name || "Guest",
          items: input.items,
          deliveryMethod: input.deliveryMethod,
          successUrl: `${origin}/checkout/success`,
          cancelUrl: `${origin}/checkout/cancel`,
        });

        console.log('[Checkout] Session created successfully:', session.sessionId);
        return session;
      } catch (error: any) {
        console.error('[Checkout] Error creating session:', {
          message: error?.message,
          type: error?.type,
          code: error?.code,
          stack: error?.stack,
        });
        throw error;
      }
    }),
});
