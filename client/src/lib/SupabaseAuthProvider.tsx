import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Declare the AppleID global from the Apple JS SDK
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            id_token: string;
            code: string;
            state?: string;
          };
          user?: {
            name?: { firstName?: string; lastName?: string };
            email?: string;
          };
        }>;
      };
    };
  }
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
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
  signInWithApple: async () => {},
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

  const signInWithApple = useCallback(async () => {
    try {
      // Use Sign in with Apple JS (popup mode) — bypasses the server-side code exchange
      if (!window.AppleID) {
        console.error("[Apple] AppleID JS SDK not loaded");
        // Fallback to OAuth redirect if SDK not available
        await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        return;
      }

      // Initialize Apple Sign In
      window.AppleID.auth.init({
        clientId: "site.bosshookah.signin",
        scope: "name email",
        redirectURI: `${window.location.origin}/auth/callback`,
        usePopup: true,
      });

      // Trigger the Apple Sign In popup
      const response = await window.AppleID.auth.signIn();
      console.log("[Apple] Sign in response received");

      const idToken = response.authorization.id_token;

      if (!idToken) {
        throw new Error("No id_token in Apple response");
      }

      // Exchange the Apple id_token with Supabase — no server-side code exchange needed
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: idToken,
      });

      if (error) {
        console.error("[Apple] signInWithIdToken error:", error);
        throw error;
      }

      console.log("[Apple] Signed in successfully:", data.user?.email);
    } catch (err: unknown) {
      // User closed the popup — not an error
      if (err && typeof err === "object" && "error" in err && (err as { error: string }).error === "popup_closed_by_user") {
        console.log("[Apple] User closed the sign-in popup");
        return;
      }
      console.error("[Apple] Sign in error:", err);
    }
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
      signInWithApple,
      signOut,
      logout: signOut,
      refresh,
    }),
    [session, loading, signInWithGoogle, signInWithApple, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  return useContext(AuthContext);
}
