import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Alias for signOut — kept for compatibility with existing components */
  logout: () => Promise<void>;
  /** Refresh the session — kept for compatibility */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) setSession(data.session);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isAuthenticated: Boolean(session?.user),
      signInWithGoogle,
      signOut,
      logout: signOut,
      refresh,
    }),
    [session, loading, signInWithGoogle, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  return useContext(AuthContext);
}
