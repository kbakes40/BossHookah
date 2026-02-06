import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import CartDrawer from "./components/CartDrawer";
import AgeVerificationModal from "./components/AgeVerificationModal";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import ProductDetail from "./pages/ProductDetail";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import SignIn from "./pages/SignIn";
import CreateAccount from "./pages/CreateAccount";
import MyAccount from "./pages/MyAccount";
import OrderHistory from "./pages/OrderHistory";
import MemberPerks from "./pages/MemberPerks";
import BrandCollection from "./pages/BrandCollection";
import FloatingRewardsButton from "./components/FloatingRewardsButton";
function Router() {
  const [location] = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/collections/:category"} component={Collection} />
      <Route path={"/product/:id"} component={ProductDetail} />
      <Route path={"/checkout/success"} component={CheckoutSuccess} />
      <Route path={"/checkout/cancel"} component={CheckoutCancel} />
      <Route path={"/sign-in"} component={SignIn} />
      <Route path={"/create-account"} component={CreateAccount} />
      <Route path={"/account"} component={MyAccount} />
      <Route path={"/orders"} component={OrderHistory} />
      <Route path={"/rewards"} component={MemberPerks} />
      <Route path={"/hookahs"}>
        {() => <Collection />}
      </Route>
      <Route path={"/shisha/:brand"}>
        {() => <BrandCollection />}
      </Route>
      <Route path={"/shisha"}>
        {() => <Collection />}
      </Route>
      <Route path={"/charcoal/:brand"}>
        {() => <BrandCollection />}
      </Route>
      <Route path={"/charcoal"}>
        {() => <Collection />}
      </Route>
      <Route path={"/vapes/:brand"}>
        {() => <BrandCollection />}
      </Route>
      <Route path={"/vapes"}>
        {() => <Collection />}
      </Route>
      <Route path={"/accessories"}>
        {() => <Collection />}
      </Route>
      <Route path={"/bowls"}>
        {() => <Collection />}
      </Route>
      <Route path={"/bundles"}>
        {() => <Collection />}
      </Route>
      <Route path={"/deals"}>
        {() => <Collection />}
      </Route>
      <Route path={"/wholesale"}>
        {() => <Collection />}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <AgeVerificationModal />
            <Router />
            <CartDrawer />
            <FloatingRewardsButton />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
