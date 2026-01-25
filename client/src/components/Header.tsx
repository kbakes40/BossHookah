// Header Component - Neo-Brutalism meets Luxury Retail
// Features: Sticky header, navigation, search, cart icon

import { ShoppingCart, Search, Menu, User } from "lucide-react";
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
          <a className="hover:text-primary transition-colors duration-150">
            New Premium Hookahs Available! Check it out →
          </a>
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
              
              <Link href="/">
                <a className="flex items-center">
                  <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center brutalist-border font-display text-xl font-black">
                    5★
                  </div>
                </a>
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
            <Link href="/hookahs">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">🫖</span>
                <span className="text-sm font-semibold">Hookahs</span>
              </a>
            </Link>
            <Link href="/shisha">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">🍃</span>
                <span className="text-sm font-semibold">Shisha</span>
              </a>
            </Link>
            <Link href="/charcoal">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">⚫</span>
                <span className="text-sm font-semibold">Charcoal</span>
              </a>
            </Link>
            <Link href="/accessories">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">🔧</span>
                <span className="text-sm font-semibold">Accessories</span>
              </a>
            </Link>
            <Link href="/bowls">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">🥣</span>
                <span className="text-sm font-semibold">Hookah Bowls</span>
              </a>
            </Link>
            <Link href="/bundles">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">📦</span>
                <span className="text-sm font-semibold">Bundles</span>
              </a>
            </Link>
            <Link href="/deals">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">🏷️</span>
                <span className="text-sm font-semibold">Deals</span>
              </a>
            </Link>
            <Link href="/wholesale">
              <a className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">🚚</span>
                <span className="text-sm font-semibold">Wholesale</span>
              </a>
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-background z-40 lg:hidden overflow-y-auto">
          <div className="container py-8">
            <Button
              variant="ghost"
              size="icon"
              className="mb-8"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✕
            </Button>
            <nav className="flex flex-col gap-6">
              <Link href="/hookahs">
                <a className="text-2xl font-display font-bold hover:text-primary">Hookahs</a>
              </Link>
              <Link href="/shisha">
                <a className="text-2xl font-display font-bold hover:text-primary">Shisha</a>
              </Link>
              <Link href="/charcoal">
                <a className="text-2xl font-display font-bold hover:text-primary">Charcoal</a>
              </Link>
              <Link href="/accessories">
                <a className="text-2xl font-display font-bold hover:text-primary">Accessories</a>
              </Link>
              <Link href="/bowls">
                <a className="text-2xl font-display font-bold hover:text-primary">Hookah Bowls</a>
              </Link>
              <Link href="/bundles">
                <a className="text-2xl font-display font-bold hover:text-primary">Bundles</a>
              </Link>
              <Link href="/deals">
                <a className="text-2xl font-display font-bold hover:text-primary">Deals</a>
              </Link>
              <Link href="/wholesale">
                <a className="text-2xl font-display font-bold hover:text-primary">Wholesale</a>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
