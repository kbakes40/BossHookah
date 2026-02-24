import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "/";

    // Apple uses form_post which means the tokens arrive as URL hash fragments
    // or are exchanged server-side by Supabase. We need to wait for
    // onAuthStateChange to fire with the new session rather than calling
    // getSession() immediately (which may not have the session yet).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        window.location.replace(returnTo);
        return;
      }
      if (event === "INITIAL_SESSION") {
        if (session) {
          subscription.unsubscribe();
          window.location.replace(returnTo);
        }
        // If INITIAL_SESSION fires with no session, keep waiting a bit
        // for the token exchange to complete (Apple form_post can be slow)
      }
    });

    // Fallback: if after 5 seconds there's still no session, check manually
    const timeout = setTimeout(async () => {
      subscription.unsubscribe();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.replace(returnTo);
      } else {
        // Try to exchange the code from URL if present (PKCE flow)
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (!error) {
            window.location.replace(returnTo);
            return;
          }
        }
        window.location.replace("/sign-in");
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
