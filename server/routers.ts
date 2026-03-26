import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { checkoutRouter } from "./checkoutRouter";
import { adminRouter } from "./adminRouter";
import { storeRouter } from "./storeRouter";
import { ordersRouter } from "./ordersRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // Returns the currently authenticated user (from Supabase JWT context)
    me: publicProcedure.query(opts => opts.ctx.user),
    /**
     * Runs context + profile/`bh_customers` sync when called with a valid JWT.
     * Used on SIGNED_IN / INITIAL_SESSION so Customers tab updates without waiting for other tRPC calls.
     */
    syncSession: publicProcedure.mutation(() => {
      return { ok: true as const };
    }),
    // Logout is handled client-side by Supabase; this is a no-op kept for compatibility
    logout: publicProcedure.mutation(() => {
      return { success: true } as const;
    }),
  }),
  checkout: checkoutRouter,
  admin: adminRouter,
  store: storeRouter,
  orders: ordersRouter,
});

export type AppRouter = typeof appRouter;
