/**
 * Authenticated user exposed on tRPC context (`auth.me`, `useAuth`).
 * Backed by Supabase `public.profiles` + Auth users.
 */
export type UserRole = "user" | "admin";

export type TrpcUser = {
  id: string;
  /** Same as `id` (Supabase Auth UUID); kept for legacy call sites. */
  openId: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  loginMethod: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
};
