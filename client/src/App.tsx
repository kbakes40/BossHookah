import { Toaster } from "@/components/ui/sonner";
import { SupabaseAuthProvider } from "@/lib/SupabaseAuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import CartDrawer from "./components/CartDrawer";
import AgeVerificationModal from "./components/AgeVerificationModal";
import Home from "./pages/Home";
import RouteFallback from "./components/RouteFallback";
import {
  About,
  AdminAnalytics,
  AdminCustomers,
  AdminDashboard,
  AdminInventory,
  AdminLogin,
  AdminOrders,
  AdminPlaceholder,
  AdminSales,
  AdminStoreSettings,
  AgeVerification,
  AuthCallback,
  Blog,
  BrandCollection,
  CheckoutCancel,
  CheckoutPayPalReturn,
  CheckoutSuccess,
  Collection,
  Contact,
  CreateAccount,
  MemberPerks,
  Military,
  MyAccount,
  NotFound,
  OrderHistory,
  ProductDetail,
  Returns,
  SearchResults,
  SignIn,
  Terms,
  Wishlist,
  ZelleCheckout,
} from "@/lazyPages";
import FloatingRewardsButton from "./components/FloatingRewardsButton";

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/collections/:category"} component={Collection} />
        <Route path={"/product/:id"} component={ProductDetail} />
        <Route path={"/checkout/success"} component={CheckoutSuccess} />
        <Route path={"/checkout/paypal-return"} component={CheckoutPayPalReturn} />
        <Route path={"/checkout/cancel"} component={CheckoutCancel} />
        <Route path={"/zelle-checkout"} component={ZelleCheckout} />
        <Route path={"/sign-in"} component={SignIn} />
        <Route path={"/auth/callback"} component={AuthCallback} />
        <Route path={"/create-account"} component={CreateAccount} />
        <Route path={"/account"} component={MyAccount} />
        <Route path={"/orders"} component={OrderHistory} />
        <Route path={"/rewards"} component={MemberPerks} />
        <Route path={"/hookahs"}>{() => <Collection />}</Route>
        <Route path={"/shisha/:brand"}>{() => <BrandCollection />}</Route>
        <Route path={"/shisha"}>{() => <Collection />}</Route>
        <Route path={"/charcoal/:brand"}>{() => <BrandCollection />}</Route>
        <Route path={"/charcoal"}>{() => <Collection />}</Route>
        <Route path={"/vapes/:brand"}>{() => <BrandCollection />}</Route>
        <Route path={"/vapes"}>{() => <Collection />}</Route>
        <Route path={"/accessories"}>{() => <Collection />}</Route>
        <Route path={"/bowls"}>{() => <Collection />}</Route>
        <Route path={"/bundles"}>{() => <Collection />}</Route>
        <Route path={"/deals"}>{() => <Collection />}</Route>
        <Route path={"/wholesale"}>{() => <Collection />}</Route>
        <Route path={"/terms"} component={Terms} />
        <Route path={"/blog"} component={Blog} />
        <Route path={"/contact"} component={Contact} />
        <Route path={"/military"} component={Military} />
        <Route path={"/returns"} component={Returns} />
        <Route path={"/wishlist"} component={Wishlist} />
        <Route path={"/age-verification"} component={AgeVerification} />
        <Route path={"/about"} component={About} />
        <Route path={"/search"} component={SearchResults} />
        <Route path={"/admin"} component={AdminLogin} />
        <Route path={"/admin/dashboard"} component={AdminDashboard} />
        <Route path={"/admin/orders"} component={AdminOrders} />
        <Route path={"/admin/customers"} component={AdminCustomers} />
        <Route path={"/admin/inventory"} component={AdminInventory} />
        <Route path={"/admin/sales"} component={AdminSales} />
        <Route path={"/admin/content"} component={AdminPlaceholder} />
        <Route path={"/admin/discounts"} component={AdminPlaceholder} />
        <Route path={"/admin/analytics"} component={AdminAnalytics} />
        <Route path={"/admin/marketing"} component={AdminPlaceholder} />
        <Route path={"/admin/store-settings"} component={AdminStoreSettings} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <ThemeProvider defaultTheme="light">
          <CurrencyProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <AgeVerificationModal />
                <Router />
                <CartDrawer />
                <FloatingRewardsButton />
              </TooltipProvider>
            </CartProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
