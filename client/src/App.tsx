import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/collections/:category"} component={Collection} />
      <Route path={"/product/:id"} component={ProductDetail} />
      <Route path={"/checkout/success"} component={CheckoutSuccess} />
      <Route path={"/checkout/cancel"} component={CheckoutCancel} />
      <Route path={"/hookahs"}>
        {() => <Collection />}
      </Route>
      <Route path={"/shisha"}>
        {() => <Collection />}
      </Route>
      <Route path={"/charcoal"}>
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
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
