/**
 * Admin Router — Supabase bh_* tables (service role).
 */
import { z } from "zod";
import { ADMIN_INVENTORY_PAGE_SIZE } from "@shared/const";
import { TRPCError } from "@trpc/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { router, adminProcedure } from "./_core/trpc";
import { supabaseAdmin } from "./_core/supabaseAdmin";
import {
  mapOrderRow,
  mapCustomerRow,
  mapProductInventoryRow,
  mapProfileAdminRow,
  mapStoreSettingsRow,
  storeSettingsToSnake,
} from "./_core/supabaseMappers";
import { countSiteCatalogSkus, siteProductsToBhRows } from "./siteCatalogSync";
import {
  buildSalesReport,
  type OrderForAnalytics,
  type ProductCostRow,
} from "./salesAnalytics";

function formatSupabaseErr(err: PostgrestError): string {
  return [err.message, err.details, err.hint, err.code ? `(${err.code})` : ""]
    .filter(Boolean)
    .join(" ");
}

/** Strip characters that break PostgREST `or()` / `ilike` filters. */
function sanitizeIlikeTerm(raw: string): string {
  return raw.trim().replace(/[%(),]/g, "").slice(0, 120);
}

/** Remove prior catalog imports (sku starts with catalog:). Uses select + delete by id for broad PostgREST compatibility. */
async function deleteBhProductsCatalogRows(): Promise<void> {
  const { data: rows, error: selErr } = await supabaseAdmin
    .from("bh_products")
    .select("id")
    .like("sku", "catalog:%");

  if (selErr) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: formatSupabaseErr(selErr) });
  }

  const ids = (rows ?? []).map(r => String((r as { id: string }).id));
  const DEL_CHUNK = 100;
  for (let i = 0; i < ids.length; i += DEL_CHUNK) {
    const slice = ids.slice(i, i + DEL_CHUNK);
    const { error: delErr } = await supabaseAdmin.from("bh_products").delete().in("id", slice);
    if (delErr) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: formatSupabaseErr(delErr) });
    }
  }
}

export const adminRouter = router({
  getStats: adminProcedure.query(async () => {
    const [
      { count: totalOrders },
      { count: totalCustomers },
      { count: totalProducts },
      { data: revenueData },
      { count: pendingOrders },
      { count: lowStockProducts },
    ] = await Promise.all([
      supabaseAdmin.from("bh_orders").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("bh_customers").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("bh_products").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("bh_orders").select("total_amount").eq("status", "paid"),
      supabaseAdmin.from("bh_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("bh_products").select("*", { count: "exact", head: true }).lt("stock", 5),
    ]);

    const totalRevenueCents = (revenueData || []).reduce(
      (sum: number, o: { total_amount?: number }) => sum + (o.total_amount || 0),
      0
    );

    return {
      totalOrders: totalOrders || 0,
      totalCustomers: totalCustomers || 0,
      totalProducts: totalProducts || 0,
      totalRevenueCents,
      /** Paid orders only; dollars for dashboard display */
      totalRevenue: totalRevenueCents / 100,
      pendingOrders: pendingOrders || 0,
      lowStockProducts: lowStockProducts || 0,
    };
  }),

  getOrders: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.string().optional().default("all"),
        fulfillmentStatus: z.string().optional().default("all"),
        deliveryMethod: z.string().optional().default("all"),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.pageSize;
      let query = supabaseAdmin
        .from("bh_orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + input.pageSize - 1);

      if (input.status && input.status !== "all") {
        query = query.eq("status", input.status);
      }
      if (input.fulfillmentStatus && input.fulfillmentStatus !== "all") {
        query = query.eq("fulfillment_status", input.fulfillmentStatus);
      }
      if (input.deliveryMethod && input.deliveryMethod !== "all") {
        query = query.eq("delivery_method", input.deliveryMethod);
      }

      const { data, count, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return {
        orders: (data || []).map(row => mapOrderRow(row as Record<string, unknown>)),
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.string().optional(),
        fulfillmentStatus: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.status) update.status = input.status;
      if (input.fulfillmentStatus) update.fulfillment_status = input.fulfillmentStatus;

      const { error } = await supabaseAdmin.from("bh_orders").update(update).eq("id", input.orderId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  confirmZellePayment: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
      const { data: row, error: fetchError } = await supabaseAdmin
        .from("bh_orders")
        .select("id, payment_method, status")
        .eq("id", input.orderId)
        .maybeSingle();

      if (fetchError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: fetchError.message });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      const r = row as { payment_method?: string; status?: string };
      if (r.payment_method !== "zelle") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not a Zelle order" });
      }
      if (r.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is not pending payment" });
      }

      const { error } = await supabaseAdmin
        .from("bh_orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", input.orderId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  deleteOrder: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin.from("bh_orders").delete().eq("id", input.orderId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  getCustomers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.pageSize;
      let query = supabaseAdmin
        .from("bh_customers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + input.pageSize - 1);

      if (input.search) {
        const term = sanitizeIlikeTerm(input.search);
        if (term) {
          const q = `%${term}%`;
          query = query.or(`name.ilike.${q},email.ilike.${q}`);
        }
      }

      const { data, count, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return {
        customers: (data || []).map(row => mapCustomerRow(row as Record<string, unknown>)),
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * Flat customer list for admin table + CSV (up to 10k rows; search optional).
   */
  customers: router({
    list: adminProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ input }) => {
        const maxRows = 10_000;
        let query = supabaseAdmin
          .from("bh_customers")
          .select("id,email,name,order_count,total_spent,created_at,updated_at")
          .order("created_at", { ascending: false })
          .limit(maxRows);

        if (input.search?.trim()) {
          const term = sanitizeIlikeTerm(input.search);
          if (term) {
            const q = `%${term}%`;
            query = query.or(`name.ilike.${q},email.ilike.${q}`);
          }
        }

        const { data, error } = await query;
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

        return (data ?? []).map(row => {
          const r = row as {
            id: string;
            email: string;
            name: string | null;
            order_count?: number | null;
            total_spent?: number | string | null;
            created_at: string;
            updated_at: string;
          };
          return {
            id: String(r.id),
            email: r.email,
            name: r.name?.trim() ? r.name : "—",
            orders: Number(r.order_count) || 0,
            totalSpent: Number(r.total_spent) || 0,
            joined: r.created_at,
            updated: r.updated_at,
          };
        });
      }),
  }),

  /** Supabase `profiles` — everyone who has signed in (JWT synced). */
  getProfiles: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(50),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.pageSize;
      let query = supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact" })
        .order("last_signed_in", { ascending: false })
        .range(offset, offset + input.pageSize - 1);

      const term = input.search ? sanitizeIlikeTerm(input.search) : "";
      if (term) {
        const q = `%${term}%`;
        query = query.or(`email.ilike.${q},name.ilike.${q}`);
      }

      const { data, count, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return {
        profiles: (data || []).map(row => mapProfileAdminRow(row as Record<string, unknown>)),
        total: count || 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  deleteCustomer: adminProcedure
    .input(z.object({ customerId: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin.from("bh_customers").delete().eq("id", input.customerId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  /** Rows that would be synced from client `products` (incl. variant SKUs). */
  siteCatalogSkuCount: adminProcedure.query(() => ({
    count: countSiteCatalogSkus(),
  })),

  /**
   * Copies storefront catalog (client/src/lib/products.ts) into bh_products.
   * SKUs use prefix `catalog:` — replace mode deletes only those rows, then inserts.
   */
  syncSiteCatalog: adminProcedure
    .input(
      z.object({
        mode: z.enum(["replace", "merge"]).default("replace"),
        defaultStock: z.number().int().min(0).max(999999).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const rows = siteProductsToBhRows(undefined, {
        defaultStock: input.defaultStock ?? 50,
      });
      const chunk = 120;

      if (input.mode === "replace") {
        await deleteBhProductsCatalogRows();
        for (let i = 0; i < rows.length; i += chunk) {
          const batch = rows.slice(i, i + chunk);
          const { error } = await supabaseAdmin.from("bh_products").insert(batch);
          if (error) {
            const msg = formatSupabaseErr(error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `${msg} If this mentions UNIQUE or duplicate sku, run supabase/migrations/003_bh_products_sku_unique_fix.sql and try again.`,
            });
          }
        }
        return { success: true as const, mode: input.mode, count: rows.length };
      }

      for (let i = 0; i < rows.length; i += chunk) {
        const batch = rows.slice(i, i + chunk);
        const { error } = await supabaseAdmin.from("bh_products").upsert(batch, {
          onConflict: "sku",
          ignoreDuplicates: true,
        });
        if (error) {
          const msg = formatSupabaseErr(error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `${msg} If this mentions ON CONFLICT, run supabase/migrations/003_bh_products_sku_unique_fix.sql in the SQL editor.`,
          });
        }
      }
      return { success: true as const, mode: input.mode, count: rows.length };
    }),

  getInventory: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(50),
        category: z.string().optional(),
        search: z.string().optional(),
        /** When true, only products with stock below 5 (same threshold as dashboard low-stock count). */
        lowStockOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const page = Math.max(1, Math.floor(input.page));
      const rawPs = Number(input.pageSize);
      const pageSize = Math.min(
        200,
        Math.max(
          ADMIN_INVENTORY_PAGE_SIZE,
          Number.isFinite(rawPs) && rawPs > 0 ? Math.floor(rawPs) : ADMIN_INVENTORY_PAGE_SIZE
        )
      );
      const offset = (page - 1) * pageSize;
      let query = supabaseAdmin
        .from("bh_products")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (input.category) {
        query = query.eq("category", input.category);
      }
      if (input.lowStockOnly) {
        query = query.lt("stock", 5);
      }

      const term = input.search ? sanitizeIlikeTerm(input.search) : "";
      if (term) {
        const q = `%${term}%`;
        query = query.or(`name.ilike.${q},brand.ilike.${q},sku.ilike.${q},category.ilike.${q}`);
      }

      const { data, count, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return {
        items: (data || []).map(row => mapProductInventoryRow(row as Record<string, unknown>)),
        total: count || 0,
        page,
        pageSize,
      };
    }),

  updateInventoryStock: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        stock: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from("bh_products")
        .update({ stock: input.stock })
        .eq("id", input.productId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  addInventoryItem: adminProcedure
    .input(
      z.object({
        name: z.string(),
        brand: z.string().optional(),
        category: z.string(),
        price: z.number(),
        cost: z.number().min(0).optional().nullable(),
        stock: z.number(),
        sku: z.string().optional(),
        badge: z.string().optional(),
        in_stock: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin.from("bh_products").insert({
        name: input.name,
        brand: input.brand || null,
        category: input.category,
        price: input.price,
        cost: input.cost ?? null,
        stock: input.stock,
        sku: input.sku || null,
        badge: input.badge || null,
        in_stock: input.in_stock,
      });

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  updateProductCost: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        cost: z.number().min(0).nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from("bh_products")
        .update({ cost: input.cost, updated_at: new Date().toISOString() })
        .eq("id", input.productId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  getSalesReport: adminProcedure
    .input(
      z.object({
        dateFrom: z.string().min(8),
        dateTo: z.string().min(8),
        deliveryMethod: z.enum(["all", "shipping", "pickup"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      const from = input.dateFrom.includes("T")
        ? input.dateFrom
        : `${input.dateFrom}T00:00:00.000Z`;
      const to = input.dateTo.includes("T") ? input.dateTo : `${input.dateTo}T23:59:59.999Z`;

      let oq = supabaseAdmin
        .from("bh_orders")
        .select("id, created_at, status, delivery_method, total_amount, items")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: true })
        .range(0, 9999);

      if (input.deliveryMethod !== "all") {
        oq = oq.eq("delivery_method", input.deliveryMethod);
      }

      const { data: orderRows, error: oe } = await oq;
      if (oe)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: oe.message });

      const { data: prodRows, error: pe } = await supabaseAdmin
        .from("bh_products")
        .select("id, name, brand, sku, cost");

      if (pe)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: pe.message });

      const products: ProductCostRow[] = (prodRows ?? []).map(
        (r: Record<string, unknown>) => ({
          id: String(r.id ?? ""),
          name: String(r.name ?? ""),
          brand: String(r.brand ?? ""),
          sku: r.sku != null ? String(r.sku) : null,
          cost: r.cost != null && r.cost !== "" ? Number(r.cost) : null,
        })
      );

      const orders: OrderForAnalytics[] = (orderRows ?? []).map(
        (row: Record<string, unknown>) => ({
          id: String(row.id ?? ""),
          createdAt: String(row.created_at ?? ""),
          status: String(row.status ?? ""),
          deliveryMethod: String(row.delivery_method ?? "shipping"),
          totalAmount: Number(row.total_amount) || 0,
          items: row.items,
        })
      );

      const report = buildSalesReport({ orders, products });

      return {
        ...report,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        deliveryMethod: input.deliveryMethod,
      };
    }),

  getStoreSettings: adminProcedure.query(async () => {
    const { data, error } = await supabaseAdmin.from("bh_store_settings").select("*").limit(1).maybeSingle();

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return mapStoreSettingsRow((data ?? null) as Record<string, unknown> | null);
  }),

  updateStoreSettings: adminProcedure
    .input(
      z.object({
        storeName: z.string(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        hours: z.string().optional(),
        pickupInstructions: z.string().optional(),
        zelleEmail: z.string().optional(),
        zellePhone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updatedAt = new Date().toISOString();
      const payload = storeSettingsToSnake(input, updatedAt);

      const { data: existing, error: findError } = await supabaseAdmin
        .from("bh_store_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (findError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: findError.message });

      if (existing && (existing as { id?: string }).id) {
        const { error } = await supabaseAdmin
          .from("bh_store_settings")
          .update(payload)
          .eq("id", (existing as { id: string }).id);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      } else {
        const { error } = await supabaseAdmin.from("bh_store_settings").insert({
          ...payload,
          created_at: updatedAt,
        });
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { success: true };
    }),
});
