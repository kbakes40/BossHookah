import type { User as AuthUser } from "@supabase/supabase-js";
import type { TrpcUser } from "@shared/trpcUser";
import { ENV } from "./env";
import { supabaseAdmin } from "./supabaseAdmin";

function isDesignatedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return ENV.adminEmails.some((e) => e.toLowerCase() === lower);
}

/**
 * Upsert profile row after a valid JWT. Promotes to admin when email is in ENV.adminEmails
 * or when the row already has admin role.
 */
export async function syncProfileFromAuthUser(authUser: AuthUser): Promise<void> {
  const email = authUser.email?.toLowerCase() ?? null;
  const meta = authUser.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    null;

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authUser.id)
    .maybeSingle();

  let role: "user" | "admin" = "user";
  if (isDesignatedAdminEmail(email) || existing?.role === "admin") {
    role = "admin";
  }

  const now = new Date().toISOString();
  // Column must match DB schema (see supabase/migrations/001_boss_hookah_core.sql: `name`, not `full_name`)
  const { error } = await supabaseAdmin.from("profiles").upsert(
    {
      id: authUser.id,
      email,
      name: fullName,
      role,
      updated_at: now,
      last_signed_in: now,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("[profiles] upsert failed:", error.message);
  }

  /** Ensure admin Customers list (`bh_customers`) includes everyone who signs in. */
  if (email) {
    const customerRow: Record<string, unknown> = {
      email,
      updated_at: now,
    };
    if (fullName) {
      customerRow.name = fullName;
    }
    const { error: customerError } = await supabaseAdmin
      .from("bh_customers")
      .upsert(customerRow, { onConflict: "email" });
    if (customerError) {
      console.error("[bh_customers] sign-in upsert failed:", customerError.message);
    }
  }
}

export function profileRowToTrpcUser(row: {
  id: string;
  email: string | null;
  name?: string | null;
  /** Legacy column if the table was created from an older template */
  full_name?: string | null;
  role: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}): TrpcUser {
  const t = row.updated_at || row.created_at || new Date().toISOString();
  const displayName = row.name ?? row.full_name ?? null;
  return {
    id: row.id,
    openId: row.id,
    name: displayName,
    email: row.email,
    role: row.role === "admin" ? "admin" : "user",
    loginMethod: "supabase",
    stripeCustomerId: null,
    createdAt: row.created_at || t,
    updatedAt: t,
    lastSignedIn: t,
  };
}

export async function getTrpcUserById(id: string): Promise<TrpcUser | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[profiles] load failed:", error.message);
    return null;
  }

  return profileRowToTrpcUser(data as Parameters<typeof profileRowToTrpcUser>[0]);
}
