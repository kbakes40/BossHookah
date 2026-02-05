// My Account Page - Demo User Dashboard
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "wouter";
import { User, Package, MapPin, CreditCard, LogOut } from "lucide-react";

export default function MyAccount() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const demoUser = localStorage.getItem("demoUser");
    if (demoUser) {
      const userData = JSON.parse(demoUser);
      setUser(userData);
      setName(userData.name);
      setEmail(userData.email);
    } else {
      setLocation("/sign-in");
    }
  }, [setLocation]);

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name, email };
    localStorage.setItem("demoUser", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("demoUser");
    toast.success("Logged out successfully");
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-display font-black">MY ACCOUNT</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="brutalist-border gap-2"
            >
              <LogOut className="h-4 w-4" />
              LOGOUT
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar Navigation */}
            <div className="space-y-3">
              <Link href="/account" className="block">
                <div className="brutalist-border p-4 bg-primary text-primary-foreground hover:translate-x-1 transition-transform">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <span className="font-bold">Profile</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/orders" className="block">
                <div className="brutalist-border p-4 hover:bg-secondary hover:translate-x-1 transition-all">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5" />
                    <span className="font-bold">Order History</span>
                  </div>
                </div>
              </Link>

              <div className="brutalist-border p-4 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  <span className="font-bold">Addresses</span>
                </div>
              </div>

              <div className="brutalist-border p-4 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-bold">Payment Methods</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2">
              <div className="brutalist-border bg-background p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-black">PROFILE INFORMATION</h2>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="brutalist-border"
                    >
                      EDIT
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-bold mb-2">
                        FULL NAME
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="brutalist-border"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-bold mb-2">
                        EMAIL ADDRESS
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="brutalist-border"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveProfile}
                        className="brutalist-border brutalist-shadow bg-primary text-primary-foreground"
                      >
                        SAVE CHANGES
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setName(user.name);
                          setEmail(user.email);
                        }}
                        variant="outline"
                        className="brutalist-border"
                      >
                        CANCEL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-muted-foreground">
                        FULL NAME
                      </label>
                      <p className="text-lg font-semibold">{user.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-muted-foreground">
                        EMAIL ADDRESS
                      </label>
                      <p className="text-lg font-semibold">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-muted-foreground">
                        MEMBER SINCE
                      </label>
                      <p className="text-lg font-semibold">
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Today'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t-3 border-border">
                  <h3 className="text-lg font-display font-black mb-4">ACCOUNT ACTIONS</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start brutalist-border"
                      onClick={() => toast.info("Demo feature - not implemented")}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start brutalist-border"
                      onClick={() => toast.info("Demo feature - not implemented")}
                    >
                      Email Preferences
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start brutalist-border text-destructive"
                      onClick={() => toast.info("Demo feature - not implemented")}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
