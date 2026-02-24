import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const handled = useRef(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const fullUrl = window.location.href;
    const search = window.location.search;
    const hash = window.location.hash;
    const params = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.substring(1));

    const debug = {
      fullUrl,
      search,
      hash,
      code: params.get("code"),
      error: params.get("error"),
      errorDescription: params.get("error_description"),
      accessToken: hashParams.get("access_token") ? "present" : "absent",
      refreshToken: hashParams.get("refresh_token") ? "present" : "absent",
    };

    console.log("[AuthCallback] Debug info:", JSON.stringify(debug, null, 2));
    setDebugInfo(JSON.stringify(debug, null, 2));

    const returnTo = params.get("returnTo") || "/";
    const code = params.get("code");
    const accessToken = hashParams.get("access_token");

    const doRedirect = (success: boolean) => {
      console.log("[AuthCallback] Redirecting, success:", success);
      window.location.replace(success ? returnTo : "/sign-in");
    };

    if (params.get("error")) {
      console.error("[AuthCallback] OAuth error:", params.get("error"), params.get("error_description"));
      doRedirect(false);
      return;
    }

    if (accessToken) {
      // Implicit flow — tokens in hash
      console.log("[AuthCallback] Implicit flow - access token in hash");
      setTimeout(async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("[AuthCallback] Session after hash:", session?.user?.email, error);
        doRedirect(!!session);
      }, 800);
    } else if (code) {
      // PKCE flow — exchange code
      console.log("[AuthCallback] PKCE flow - exchanging code");
      supabase.auth.exchangeCodeForSession(fullUrl)
        .then(({ data, error }) => {
          console.log("[AuthCallback] Code exchange result:", data?.session?.user?.email, error);
          if (!error && data?.session) {
            doRedirect(true);
          } else {
            console.error("[AuthCallback] Code exchange failed:", error);
            doRedirect(false);
          }
        });
    } else {
      // No tokens — wait for auth state change
      console.log("[AuthCallback] No tokens in URL - waiting for auth state change");
      
      // Check if session already exists
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("[AuthCallback] Existing session check:", session?.user?.email);
        if (session) {
          doRedirect(true);
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("[AuthCallback] Auth state change:", event, session?.user?.email);
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe();
            doRedirect(true);
          }
        });

        // Fallback after 10 seconds
        setTimeout(async () => {
          subscription.unsubscribe();
          const { data: { session } } = await supabase.auth.getSession();
          console.log("[AuthCallback] Fallback session check:", session?.user?.email);
          doRedirect(!!session);
        }, 10000);
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Signing you in…</p>
        {debugInfo && (
          <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded max-w-lg overflow-auto">
            {debugInfo}
          </pre>
        )}
      </div>
    </div>
  );
}
