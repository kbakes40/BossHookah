// Sign In Page - Demo Authentication
import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "wouter";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo login - accept any credentials
    if (email && password) {
      localStorage.setItem("demoUser", JSON.stringify({
        email: email,
        name: email.split("@")[0],
        loggedIn: true
      }));
      toast.success("Welcome back!");
      setLocation("/account");
    } else {
      toast.error("Please enter email and password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16">
        <div className="container max-w-md">
          <div className="brutalist-border bg-background p-8">
            <h1 className="text-4xl font-display font-black mb-2">SIGN IN</h1>
            <p className="text-muted-foreground mb-8">
              Welcome back! Sign in to your account.
            </p>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold mb-2">
                  EMAIL ADDRESS
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="brutalist-border"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold mb-2">
                  PASSWORD
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="brutalist-border"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="brutalist-border" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-primary hover:underline font-bold">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-12 brutalist-border brutalist-shadow bg-primary text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150 text-lg font-black"
              >
                SIGN IN
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/create-account" className="text-primary hover:underline font-bold">
                  Create one now
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-8 border-t-3 border-border">
              <p className="text-xs text-center text-muted-foreground">
                🎭 <strong>DEMO MODE:</strong> Enter any email and password to sign in
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
