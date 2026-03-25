import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function safeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function AuthCallback() {
  useEffect(() => {
    let active = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let authSubscription: { unsubscribe: () => void } | null = null;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const returnTo = safeReturnTo(params.get("returnTo"));

      if (params.get("error")) {
        console.error(
          "[AuthCallback] OAuth error:",
          params.get("error"),
          params.get("error_description")
        );
        window.location.replace("/sign-in");
        return;
      }

      // detectSessionInUrl + PKCE: code is exchanged in GoTrueClient._initialize — do not exchange again here.
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (session) {
        window.location.replace(returnTo);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
        if (!active) return;
        if (event === "SIGNED_IN" && next) {
          subscription.unsubscribe();
          window.location.replace(returnTo);
        }
      });
      authSubscription = subscription;

      const t = setTimeout(async () => {
        subscription.unsubscribe();
        if (!active) return;
        const { data: { session: later } } = await supabase.auth.getSession();
        if (!active) return;
        window.location.replace(later ? returnTo : "/sign-in");
      }, 8000);
      timeouts.push(t);
    })();

    return () => {
      active = false;
      authSubscription?.unsubscribe();
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Completing sign in…</p>
      </div>
    </div>
  );
}
