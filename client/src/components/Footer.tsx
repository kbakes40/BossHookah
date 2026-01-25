// Footer Component - Neo-Brutalism meets Luxury Retail
// Features: Three-column layout, store info, social links

import { Link } from "wouter";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t-3 border-border mt-20">
      {/* Gift Card Banner */}
      <div className="bg-secondary border-b-3 border-border py-12">
        <div className="container text-center">
          <h3 className="text-3xl font-display font-black mb-2">NEED THE PERFECT GIFT?</h3>
            <Link href="/gift-cards" className="text-primary hover:underline font-semibold">
              Send a gift card →
            </Link>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Links */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Links</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Return Policy</Link></li>
              <li><Link href="/account" className="hover:text-primary transition-colors">Account</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/age-verification" className="hover:text-primary transition-colors">Age Verification</Link></li>
              <li><Link href="/military" className="hover:text-primary transition-colors">Military Discount</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Column 2: Store Location & Hours */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Store Location & Hours</h4>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">123 Main Street</p>
                <p>City, State 12345</p>
                <p className="mt-2">(555) 123-4567</p>
              </div>
              <div>
                <p className="font-semibold">Store Hours</p>
                <p>Monday - Saturday 12PM - 8PM</p>
                <p>Sunday 1PM - 6PM</p>
              </div>
              <div>
                <p className="font-semibold">Support Hours</p>
                <p>Monday - Friday 10AM - 5PM PST</p>
              </div>
            </div>
          </div>

          {/* Column 3: Social */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Social</h4>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                 className="w-12 h-12 bg-foreground text-background flex items-center justify-center brutalist-border hover:bg-primary hover:border-primary transition-colors duration-150">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                 className="w-12 h-12 bg-foreground text-background flex items-center justify-center brutalist-border hover:bg-primary hover:border-primary transition-colors duration-150">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                 className="w-12 h-12 bg-foreground text-background flex items-center justify-center brutalist-border hover:bg-primary hover:border-primary transition-colors duration-150">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t-3 border-border py-6">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <select className="brutalist-border px-4 py-2 bg-background">
              <option>United States (USD $)</option>
              <option>Canada (CAD $)</option>
              <option>United Kingdom (GBP £)</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm">Payment Methods:</span>
            <div className="flex gap-2">
              <div className="w-10 h-6 brutalist-border bg-secondary flex items-center justify-center text-xs font-bold">VISA</div>
              <div className="w-10 h-6 brutalist-border bg-secondary flex items-center justify-center text-xs font-bold">MC</div>
              <div className="w-10 h-6 brutalist-border bg-secondary flex items-center justify-center text-xs font-bold">AMEX</div>
            </div>
          </div>

          <p className="text-sm">© 2026, Premium Hookah Shop</p>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-primary text-primary-foreground px-6 py-3 brutalist-border brutalist-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150 font-bold text-sm"
      >
        BACK TO TOP
      </button>
    </footer>
  );
}
