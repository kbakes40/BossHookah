// Header Component - Neo-Brutalism Style
// Features: Sticky header, navigation with brand dropdowns, search, cart icon

import { ShoppingCart, Search, Menu, User, X, ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import PromoBar from "./PromoBar";
import { getBrandsByCategory } from "@/lib/products";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { cartCount, openCart } = useCart();

  // Categories with dropdown menus
  const categoriesWithDropdowns = ['shisha', 'vapes', 'charcoal'];

  const handleMouseEnter = (category: string) => {
    if (categoriesWithDropdowns.includes(category)) {
      setActiveDropdown(category);
    }
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <>
      {/* Promotional Banner */}
      <PromoBar />
      
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User className="h-5 w-5" />
                </Button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border-3 border-border brutalist-shadow">
                    <Link 
                      href="/sign-in" 
                      className="block px-4 py-3 hover:bg-secondary border-b-3 border-border font-semibold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/create-account" 
                      className="block px-4 py-3 hover:bg-secondary border-b-3 border-border font-semibold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Create Account
                    </Link>
                    <Link 
                      href="/account" 
                      className="block px-4 py-3 hover:bg-secondary border-b-3 border-border font-semibold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link 
                      href="/orders" 
                      className="block px-4 py-3 hover:bg-secondary font-semibold"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Order History
                    </Link>
                  </div>
                )}
              </div>
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

          {/* Navigation Bar with Dropdowns */}
          <nav className="hidden lg:flex items-center justify-center gap-8 py-4 border-t-3 border-border relative">
            <Link href="/hookahs" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
              <span className="text-2xl">🫖</span>
              <span className="text-sm font-semibold">Hookahs</span>
            </Link>
            
            {/* Shisha with Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('shisha')}
              onMouseLeave={handleMouseLeave}
            >
              <Link href="/shisha" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">🍃</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">Shisha</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </Link>
              {activeDropdown === 'shisha' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-background border-3 border-border brutalist-shadow z-50">
                  <div className="p-4">
                    <div className="font-bold text-sm mb-2 text-primary">SHOP BY BRAND</div>
                    {getBrandsByCategory('shisha').map((brand) => (
                      <Link
                        key={brand}
                        href={`/shisha/${brand.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block py-2 px-3 hover:bg-secondary transition-colors duration-150 font-medium text-sm"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Charcoal with Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('charcoal')}
              onMouseLeave={handleMouseLeave}
            >
              <Link href="/charcoal" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <span className="text-2xl">⚫</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">Charcoal</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </Link>
              {activeDropdown === 'charcoal' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-background border-3 border-border brutalist-shadow z-50">
                  <div className="p-4">
                    <div className="font-bold text-sm mb-2 text-primary">SHOP BY BRAND</div>
                    {getBrandsByCategory('charcoal').map((brand) => (
                      <Link
                        key={brand}
                        href={`/charcoal/${brand.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block py-2 px-3 hover:bg-secondary transition-colors duration-150 font-medium text-sm"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vapes with Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('vapes')}
              onMouseLeave={handleMouseLeave}
            >
              <Link href="/vapes" className="flex flex-col items-center gap-1 hover:text-primary transition-colors duration-150">
                <img src="https://private-us-east-1.manuscdn.com/sessionFile/hfG05ypp2E1GAEHQs4D301/sandbox/jwvHeIOnRLDODqpz72e5Tu-img-1_1770348870000_na1fn_dmFwZS1pY29uLXYy.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvaGZHMDV5cHAyRTFHQUVIUXM0RDMwMS9zYW5kYm94L2p3dkhlSU9uUkxET0RxcHo3MmU1VHUtaW1nLTFfMTc3MDM0ODg3MDAwMF9uYTFmbl9kbUZ3WlMxcFkyOXVMWFl5LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=RRTXjHbZ8EFMT7b2I9Ngu4Adadh84CRAHLVf6EIeyJz~FTgJNP-sjJVW1mdOTVqMBJjsdKAF~6FMKvd9IfpLEv6zoH56bPeFg3HndFvYKsCQ1Qg96CYJNCGwIoDAnf59cGjY4rkVDDu1wwQGZhx6fuz22oLqBtSVyRDieaSrWAj5IMyhnBzk0uZp-naokjMBuWmM1DIMYVovi311HgasZMo~636wY2nYq-hcVwT5DZzPtNAduBSN7wQB05SeR5Z-qfVMEGvC7XMRpi9FABQdkFnjZvm7~XSK3lQtURAmAT7ngFBd6ONafgKGvcl3H7joPP9EDu8YiyE6GvSbNV2rLA__" alt="Vapes" className="w-6 h-6" />
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">Vapes</span>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </Link>
              {activeDropdown === 'vapes' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-background border-3 border-border brutalist-shadow z-50">
                  <div className="p-4">
                    <div className="font-bold text-sm mb-2 text-primary">SHOP BY BRAND</div>
                    {getBrandsByCategory('vapes').map((brand) => (
                      <Link
                        key={brand}
                        href={`/vapes/${brand.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block py-2 px-3 hover:bg-secondary transition-colors duration-150 font-medium text-sm"
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b-3 border-border">
              <span className="font-display font-black text-xl">MENU</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <Link href="/hookahs" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">🫖</span>
                <span className="font-semibold">Hookahs</span>
              </Link>
              <Link href="/shisha" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">🍃</span>
                <span className="font-semibold">Shisha</span>
              </Link>
              <Link href="/charcoal" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">⚫</span>
                <span className="font-semibold">Charcoal</span>
              </Link>
              <Link href="/vapes" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <img src="https://private-us-east-1.manuscdn.com/sessionFile/hfG05ypp2E1GAEHQs4D301/sandbox/jwvHeIOnRLDODqpz72e5Tu-img-1_1770348870000_na1fn_dmFwZS1pY29uLXYy.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvaGZHMDV5cHAyRTFHQUVIUXM0RDMwMS9zYW5kYm94L2p3dkhlSU9uUkxET0RxcHo3MmU1VHUtaW1nLTFfMTc3MDM0ODg3MDAwMF9uYTFmbl9kbUZ3WlMxcFkyOXVMWFl5LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=RRTXjHbZ8EFMT7b2I9Ngu4Adadh84CRAHLVf6EIeyJz~FTgJNP-sjJVW1mdOTVqMBJjsdKAF~6FMKvd9IfpLEv6zoH56bPeFg3HndFvYKsCQ1Qg96CYJNCGwIoDAnf59cGjY4rkVDDu1wwQGZhx6fuz22oLqBtSVyRDieaSrWAj5IMyhnBzk0uZp-naokjMBuWmM1DIMYVovi311HgasZMo~636wY2nYq-hcVwT5DZzPtNAduBSN7wQB05SeR5Z-qfVMEGvC7XMRpi9FABQdkFnjZvm7~XSK3lQtURAmAT7ngFBd6ONafgKGvcl3H7joPP9EDu8YiyE6GvSbNV2rLA__" alt="Vapes" className="w-6 h-6" />
                <span className="font-semibold">Vapes</span>
              </Link>
              <Link href="/accessories" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">🔧</span>
                <span className="font-semibold">Accessories</span>
              </Link>
              <Link href="/bowls" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">🥣</span>
                <span className="font-semibold">Hookah Bowls</span>
              </Link>
              <Link href="/bundles" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">📦</span>
                <span className="font-semibold">Bundles</span>
              </Link>
              <Link href="/deals" className="flex items-center gap-3 py-4 border-b-3 border-border hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">🏷️</span>
                <span className="font-semibold">Deals</span>
              </Link>
              <Link href="/wholesale" className="flex items-center gap-3 py-4 hover:text-primary transition-colors duration-150" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl">🚚</span>
                <span className="font-semibold">Wholesale</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-background z-[60] md:hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 p-4 border-b-3 border-border">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
              <Input
                type="search"
                placeholder="Search products..."
                className="flex-1 brutalist-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
