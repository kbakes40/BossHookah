// Inventory Management Schema
import { int, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: varchar("productId", { length: 255 }).notNull().unique(), // Matches product.id from products.ts
  productName: text("productName").notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  stockQuantity: int("stockQuantity").notNull().default(0),
  lowStockThreshold: int("lowStockThreshold").notNull().default(10),
  price: int("price").notNull(), // Price in cents
  cost: int("cost"), // Cost in cents (optional)
  sku: varchar("sku", { length: 255 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;
