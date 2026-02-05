// Header Component - Neo-Brutalism meets Luxury Retail
// Features: Sticky header, navigation, search, cart icon

import { ShoppingCart, Search, Menu, User, X, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, openCart } = useCart();

  return (
    <>
      {/* Warning Banner */}
      <div className="bg-foreground text-background py-2 text-center text-sm font-medium">
        <span className="text-primary">WARNING:</span> THIS PRODUCT CONTAINS NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.
      </div>

      {/* Announcement Bar */}
      <div className="bg-secondary py-2 text-center text-sm border-b-3 border-border">
        <Link href="/">
          <span className="hover:text-primary transition-colors duration-150 cursor-pointer">
            New Premium Hookahs Available! Check it out →
          </span>
        </Link>
      </div>

      {/* Main Header */}
      <header className="bg-background border-b-3 border-border sticky top-0 z-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between py-4">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              
              <Link href="/" className="flex items-center gap-3">
                <div className="font-display font-black text-2xl tracking-tight">
                  BOSS HOOKAH
                  <span className="block text-xs font-bold tracking-wider text-primary">WHOLESALE</span>
                </div>
              </Link>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full brutalist-border pr-10"
                  onClick={() => setSearchOpen(true)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="hidden lg:flex items-center justify-center gap-8 py-4 border-t-3 border-border">
            <Link href="/hookahs" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">🫖</span>
              <span className="text-sm font-semibold">Hookahs</span>
            </Link>
            <Link href="/shisha" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">🍃</span>
              <span className="text-sm font-semibold">Shisha</span>
            </Link>
            <Link href="/charcoal" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">⚫</span>
              <span className="text-sm font-semibold">Charcoal</span>
            </Link>
            <Link href="/accessories" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">🔧</span>
              <span className="text-sm font-semibold">Accessories</span>
            </Link>
            <Link href="/bowls" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">🥣</span>
              <span className="text-sm font-semibold">Hookah Bowls</span>
            </Link>
            <Link href="/bundles" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">📦</span>
              <span className="text-sm font-semibold">Bundles</span>
            </Link>
            <Link href="/deals" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">🏷️</span>
              <span className="text-sm font-semibold">Deals</span>
            </Link>
            <Link href="/wholesale" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">🚚</span>
              <span className="text-sm font-semibold">Wholesale</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-background z-[60] lg:hidden">
          {/* Header */}
          <div className="border-b-3 border-border p-4 flex items-center justify-between">
            <h2 className="text-2xl font-display font-black">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Menu Items */}
          <nav className="overflow-y-auto h-[calc(100vh-80px)]">
            <Link 
              href="/hookahs" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">🫖</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Hookahs</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
            
            <Link 
              href="/shisha" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">🍃</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Shisha</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
            
            <Link 
              href="/charcoal" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">⚫</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Charcoal</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
            
            <Link 
              href="/accessories" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">🔧</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Accessories</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
            
            <Link 
              href="/bowls" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">🥣</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Hookah Bowls</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
            
            <Link 
              href="/bundles" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Bundles</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
            
            <Link 
              href="/deals" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">🏷️</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Deals</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
            
            <Link 
              href="/wholesale" 
              className="flex items-center gap-4 p-6 border-b-3 border-border hover:bg-secondary transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-16 h-16 bg-primary/10 brutalist-border flex items-center justify-center">
                <span className="text-3xl">🚚</span>
              </div>
              <span className="text-xl font-display font-bold flex-1">Wholesale</span>
              <ChevronRight className="h-6 w-6" />
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
