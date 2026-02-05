import { ShoppingBag, Heart } from "lucide-react";
import { useLocation } from "wouter";

export default function FloatingRewardsButton() {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation("/rewards")}
      className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white brutalist-border brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150 flex items-center justify-center z-50 group"
      aria-label="Member Rewards"
    >
      <div className="relative">
        <ShoppingBag className="h-8 w-8" />
        <Heart 
          className="h-4 w-4 absolute -top-1 -right-1 fill-current" 
          strokeWidth={0}
        />
      </div>
    </button>
  );
}
