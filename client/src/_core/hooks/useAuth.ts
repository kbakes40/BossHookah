import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/lib/SupabaseAuthProvider";
import { useCallback } from "react";

/**
 * Unified auth hook that combines:
 * - Supabase session (for login/logout/Google OAuth)
 * - DB user from trpc.auth.me (for role, name, email stored in our database)
 *
 * This hook is the canonical useAuth for all components.
 */
export function useAuth() {
  const { session, loading: sessionLoading, signInWithGoogle, signOut } = useSupabaseAuth();

  // Only fetch the DB user when we have a Supabase session
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(session),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const loading = sessionLoading || (Boolean(session) && meQuery.isLoading);

  /** Set when session exists but tRPC could not load the profile (API, env, or schema issues). */
  const profileLoadError = Boolean(session) && !meQuery.isLoading ? meQuery.error ?? null : null;

  // The DB user has role, name, email fields used by admin pages
  const dbUser = meQuery.data ?? null;

  // Enrich with Supabase metadata as fallback for name/email
  const user = dbUser
    ? {
        ...dbUser,
        name: dbUser.name || session?.user?.user_metadata?.full_name || session?.user?.email || "",
        email: dbUser.email || session?.user?.email || "",
      }
    : null;

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const refresh = useCallback(async () => {
    await meQuery.refetch();
  }, [meQuery]);

  return {
    user,
    loading,
    isAuthenticated: Boolean(session && user),
    profileLoadError,
    signInWithGoogle,
    signOut,
    logout,
    refresh,
    session,
  };
}
