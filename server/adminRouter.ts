/**
 * Admin Router - Admin-only procedures for order and customer management
 */

import { z } from "zod";
import { router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { orders, users, inventory, storeSettings } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

// Admin-only procedure that checks user role
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN",
      message: "Admin access required"
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Get dashboard stats
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        pendingOrders: sql<number>`SUM(CASE WHEN fulfillmentStatus = 'pending' THEN 1 ELSE 0 END)`,
        totalRevenue: sql<number>`SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END)`,
      })
      .from(orders);

    const [customerStats] = await db
      .select({
        totalCustomers: sql<number>`COUNT(*)`,
      })
      .from(users);

    return {
      totalOrders: Number(orderStats?.totalOrders || 0),
      pendingOrders: Number(orderStats?.pendingOrders || 0),
      totalRevenue: Number(orderStats?.totalRevenue || 0) / 100, // Convert cents to dollars
      totalCustomers: Number(customerStats?.totalCustomers || 0),
    };
  }),

  // Get all orders with pagination
  getOrders: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.enum(["all", "pending", "paid", "failed", "refunded"]).default("all"),
        fulfillmentStatus: z.enum(["all", "pending", "ready_to_ship", "shipped", "delivered"]).default("all"),
        deliveryMethod: z.enum(["all", "shipping", "pickup"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const offset = (input.page - 1) * input.pageSize;

      let query = db
        .select({
          id: orders.id,
          userId: orders.userId,
          stripePaymentIntentId: orders.stripePaymentIntentId,
          stripeCheckoutSessionId: orders.stripeCheckoutSessionId,
          status: orders.status,
          fulfillmentStatus: orders.fulfillmentStatus,
          totalAmount: orders.totalAmount,
          currency: orders.currency,
          items: orders.items,
          shippingAddress: orders.shippingAddress,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          customerName: orders.customerName, // From Stripe checkout
          customerEmail: users.email,
          deliveryMethod: orders.deliveryMethod,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id));

      if (input.status !== "all") {
        query = query.where(eq(orders.status, input.status)) as any;
      }

      if (input.fulfillmentStatus !== "all") {
        query = query.where(eq(orders.fulfillmentStatus, input.fulfillmentStatus)) as any;
      }

      if (input.deliveryMethod !== "all") {
        query = query.where(eq(orders.deliveryMethod, input.deliveryMethod)) as any;
      }

      const results = await query
        .orderBy(desc(orders.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return results;
    }),

  // Get single order details
  getOrder: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // Get customer info
      const [customer] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId));

      return {
        ...order,
        customer,
      };
    }),

  // Update order fulfillment status
  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        fulfillmentStatus: z.enum(["pending", "ready_to_ship", "shipped", "delivered"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(orders)
        .set({ 
          fulfillmentStatus: input.fulfillmentStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      return { success: true };
    }),

  // Delete order
  deleteOrder: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .delete(orders)
        .where(eq(orders.id, input.orderId));

      return { success: true };
    }),

  // Get all customers with pagination
  getCustomers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const offset = (input.page - 1) * input.pageSize;

      const results = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return results;
    }),

  // Get customer details with order history
  getCustomer: adminProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [customer] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.customerId));

      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      const customerOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, input.customerId))
        .orderBy(desc(orders.createdAt));

      return {
        ...customer,
        orders: customerOrders,
      };
    }),

  // Get all inventory items
  getInventory: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(50),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const offset = (input.page - 1) * input.pageSize;

      let query = db.select().from(inventory);

      if (input.category) {
        query = query.where(eq(inventory.category, input.category)) as any;
      }

      const results = await query
        .orderBy(inventory.productName)
        .limit(input.pageSize)
        .offset(offset);

      return results;
    }),

  // Update inventory stock
  updateInventoryStock: adminProcedure
    .input(
      z.object({
        inventoryId: z.number(),
        stockQuantity: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(inventory)
        .set({ 
          stockQuantity: input.stockQuantity,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, input.inventoryId));

      return { success: true };
    }),

  // Add inventory item
  addInventoryItem: adminProcedure
    .input(
      z.object({
        productId: z.string(),
        productName: z.string(),
        brand: z.string(),
        category: z.string(),
        stockQuantity: z.number(),
        lowStockThreshold: z.number().default(10),
        price: z.number(),
        cost: z.number().optional(),
        sku: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(inventory).values({
        productId: input.productId,
        productName: input.productName,
        brand: input.brand,
        category: input.category,
        stockQuantity: input.stockQuantity,
        lowStockThreshold: input.lowStockThreshold,
        price: Math.round(input.price * 100), // Convert to cents
        cost: input.cost ? Math.round(input.cost * 100) : null,
        sku: input.sku || null,
      });

      return { success: true };
    }),

  // Get store settings
  getStoreSettings: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [settings] = await db
      .select()
      .from(storeSettings)
      .limit(1);

    return settings || null;
  }),

  // Update store settings
  updateStoreSettings: adminProcedure
    .input(
      z.object({
        storeName: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        hours: z.string(),
        pickupInstructions: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if settings exist
      const [existing] = await db
        .select()
        .from(storeSettings)
        .limit(1);

      if (existing) {
        // Update existing settings
        await db
          .update(storeSettings)
          .set({
            storeName: input.storeName,
            address: input.address,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
            phone: input.phone,
            email: input.email || null,
            hours: input.hours,
            pickupInstructions: input.pickupInstructions,
            updatedAt: new Date(),
          })
          .where(eq(storeSettings.id, existing.id));
      } else {
        // Create new settings
        await db.insert(storeSettings).values({
          storeName: input.storeName,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          phone: input.phone,
          email: input.email || null,
          hours: input.hours,
          pickupInstructions: input.pickupInstructions,
        });
      }

      return { success: true };
    }),
});
