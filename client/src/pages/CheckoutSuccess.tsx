// Checkout Success Page
// Displays confirmation after successful payment

import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="container max-w-2xl text-center">
          <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 brutalist-border">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          
          <h1 className="text-5xl font-display font-black mb-4">ORDER CONFIRMED!</h1>
          <p className="text-xl mb-8">
            Thank you for your purchase. Your order has been successfully processed.
          </p>
          
          <div className="bg-secondary brutalist-border p-8 mb-8">
            <p className="font-semibold mb-2">What's next?</p>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              <li>✓ You'll receive an order confirmation email shortly</li>
              <li>✓ We'll send tracking information once your order ships</li>
              <li>✓ Estimated delivery: 3-5 business days</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button className="brutalist-border brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                CONTINUE SHOPPING
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
