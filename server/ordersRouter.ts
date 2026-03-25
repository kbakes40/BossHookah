import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { supabaseAdmin } from "./_core/supabaseAdmin";
import { mapOrderRow } from "./_core/supabaseMappers";

export const ordersRouter = router({
  /** Orders for the signed-in customer's email (Stripe / Zelle / checkout capture). */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.user.email?.trim();
    if (!email) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from("bh_orders")
      .select("*")
      .ilike("customer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }

    return (data ?? []).map(row => mapOrderRow(row as Record<string, unknown>));
  }),
});
