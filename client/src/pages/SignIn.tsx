import { useSupabaseAuth } from "@/lib/SupabaseAuthProvider";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect } from "react";

export default function SignIn() {
  const { user, loading, signInWithGoogle, signInWithApple } = useSupabaseAuth();

  // If already signed in, redirect to intended destination
  useEffect(() => {
    if (!loading && user) {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo") || "/";
      window.location.replace(returnTo);
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="border-3 border-border bg-card p-8 brutalist-shadow">
            {/* Brand mark */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <span className="text-white font-black text-sm">BH</span>
              </div>
              <span className="font-black text-sm uppercase tracking-widest text-muted-foreground">
                Boss Hookah
              </span>
            </div>

            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Sign in to track your orders, manage your account, and access exclusive wholesale pricing.
            </p>

            {/* Section label */}
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Continue with
            </p>

            {/* Google Button — white with hard black shadow */}
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full h-12 bg-white text-foreground hover:bg-gray-50 active:translate-y-0.5 transition-all duration-100 text-sm font-bold flex items-center gap-3 justify-center border-2 border-border mb-3 rounded-none"
              style={{ boxShadow: "4px 4px 0 0 #0A0A0A" }}
            >
              {/* Google "G" icon */}
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.6 39.5 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.6 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
              Continue with Google
            </Button>

            {/* Apple Button — black with green brutalist shadow */}
            <Button
              onClick={signInWithApple}
              disabled={loading}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 active:translate-y-0.5 transition-all duration-100 text-sm font-bold flex items-center gap-3 justify-center border-2 border-border rounded-none"
              style={{ boxShadow: "4px 4px 0 0 #10B981" }}
            >
              {/* Apple icon */}
              <svg width="16" height="18" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" className="shrink-0 fill-current">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 134.2 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
              </svg>
              Continue with Apple
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Auto-account note */}
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account?{" "}
              <span className="font-bold text-foreground">
                One is created automatically on first sign-in.
              </span>
            </p>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By signing in you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground font-medium">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground font-medium">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Secure Login
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              No Password Needed
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Free to Join
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
