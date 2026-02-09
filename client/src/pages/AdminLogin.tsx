// Admin Login Page - Matches WiFi Kings design
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function AdminLogin() {
  const handleLogin = () => {
    // Redirect to Manus OAuth with return path to admin dashboard
    window.location.href = getLoginUrl("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <img src="/favicon-96x96.png" alt="5 Star Hookah" className="w-16 h-16" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2">
          5 Star Hookah Admin
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to access the admin dashboard
        </p>

        {/* Secure Access Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Secure Access</h3>
              <p className="text-sm text-gray-600">
                Only authorized administrators can access the dashboard. Sign in with your Manus account to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Sign In Button */}
        <Button
          onClick={handleLogin}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-base font-semibold"
        >
          Sign In to Admin Dashboard
        </Button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact your system administrator
        </p>
      </div>
    </div>
  );
}
