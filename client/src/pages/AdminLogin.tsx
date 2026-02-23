import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/lib/SupabaseAuthProvider";
import { useEffect } from "react";

export default function AdminLogin() {
  const { user, loading, signInWithGoogle } = useSupabaseAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.replace("/admin/dashboard");
    }
  }, [user, loading]);

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src="/favicon-96x96.png" alt="5 Star Hookah" className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">5 Star Hookah Admin</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to access the admin dashboard</p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Secure Access</h3>
              <p className="text-sm text-gray-600">
                Only authorized administrators can access the dashboard. Sign in with your Google account to continue.
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white text-black hover:bg-gray-50 border-2 border-gray-900 py-6 text-base font-semibold flex items-center gap-3 justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.6 39.5 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.6 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          Sign In with Google
        </Button>
        <p className="text-center text-sm text-gray-500 mt-6">Need help? Contact your system administrator</p>
      </div>
    </div>
  );
}
