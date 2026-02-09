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

      })
    )
    .mutation(async ({ ctx, input }) => {
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      
      const session = await createCheckoutSession({
        userId: ctx.user?.id || 0,
        userEmail: ctx.user?.email || "",
        userName: ctx.user?.name || "Guest",
        items: input.items,
        successUrl: `${origin}/checkout/success`,
        cancelUrl: `${origin}/checkout/cancel`,
      });

      return session;
    }),
});
