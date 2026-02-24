import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "/";

    // Handle both implicit flow (hash fragment) and PKCE flow (code param)
    const code = params.get("code");
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");

    const doRedirect = (success: boolean) => {
      window.location.replace(success ? returnTo : "/sign-in");
    };

    if (accessToken) {
      // Implicit flow — tokens are in the hash fragment
      // Supabase detectSessionInUrl handles this automatically
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        doRedirect(!!session);
      }, 500);
    } else if (code) {
      // PKCE flow — exchange code for session
      supabase.auth.exchangeCodeForSession(window.location.href)
        .then(({ error }) => {
          if (!error) {
            doRedirect(true);
          } else {
            console.error("Code exchange error:", error);
            doRedirect(false);
          }
        });
    } else {
      // No tokens yet — wait for onAuthStateChange (Apple form_post)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          doRedirect(true);
        } else if (event === "INITIAL_SESSION") {
          if (session) {
            subscription.unsubscribe();
            doRedirect(true);
          }
        }
      });

      // Fallback after 8 seconds
      const timeout = setTimeout(async () => {
        subscription.unsubscribe();
        const { data: { session } } = await supabase.auth.getSession();
        doRedirect(!!session);
      }, 8000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
