// Admin Dashboard - Main admin panel with sidebar navigation
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  LogOut,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setLocation("/admin");
      } else if (user?.role !== "admin") {
        setLocation("/");
      }
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: Package, label: "Inventory", path: "/admin/inventory" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img src="/favicon-96x96.png" alt="5 Star Hookah" className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-lg">5 Star Hookah</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent border-gray-700 hover:bg-gray-800 text-white"
            onClick={() => setLocation("/")}
          >
            <LogOut className="w-4 h-4" />
            Back to Store
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <ShoppingCart className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold">0</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <Package className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold">0</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting fulfillment</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold">0</p>
              <p className="text-xs text-gray-500 mt-1">Registered users</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <LayoutDashboard className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold">$0</p>
              <p className="text-xs text-gray-500 mt-1">Total sales</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/orders">
                <a className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">View Orders</p>
                    <p className="text-sm text-gray-600">Manage customer orders</p>
                  </div>
                </a>
              </Link>

              <Link href="/admin/customers">
                <a className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">View Customers</p>
                    <p className="text-sm text-gray-600">Browse customer list</p>
                  </div>
                </a>
              </Link>

              <Link href="/admin/inventory">
                <a className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors">
                  <Package className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">Manage Inventory</p>
                    <p className="text-sm text-gray-600">Update stock levels</p>
                  </div>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
