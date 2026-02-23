import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    // Supabase handles the token exchange from the URL hash/query automatically.
    // Once the session is set, redirect to the intended destination.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo") || "/";
      if (session) {
        window.location.replace(returnTo);
      } else {
        window.location.replace("/sign-in");
      }
    });
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
