import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type ShopCurrencyId,
  SHOP_CURRENCY_STORAGE_KEY,
  isShopCurrencyId,
  formatDisplayMoney,
  formatDisplayTotalsFromUsd,
  convertUsdToDisplayAmount,
} from "@shared/currency";

export type ShopCurrencyContextValue = {
  currency: ShopCurrencyId;
  setCurrency: (c: ShopCurrencyId) => void;
  /** Format a USD storefront amount for the current display currency. */
  formatUsd: (usd: number) => string;
  convertUsd: (usd: number) => number;
  /** Subtotal/shipping/total strings; total = rounded(subtotal + shipping) in display units. */
  displayTotals: (subtotalUsd: number, shippingUsd: number) => {
    subtotal: string;
    shipping: string;
    total: string;
  };
};

const ShopCurrencyContext = createContext<ShopCurrencyContextValue | undefined>(undefined);

function readStoredCurrency(): ShopCurrencyId {
  if (typeof window === "undefined") return "usd";
  try {
    const raw = localStorage.getItem(SHOP_CURRENCY_STORAGE_KEY);
    if (raw && isShopCurrencyId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "usd";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<ShopCurrencyId>(readStoredCurrency);

  useEffect(() => {
    try {
      localStorage.setItem(SHOP_CURRENCY_STORAGE_KEY, currency);
    } catch {
      /* ignore */
    }
  }, [currency]);

  const setCurrency = useCallback((c: ShopCurrencyId) => setCurrencyState(c), []);

  const value = useMemo<ShopCurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      formatUsd: usd => formatDisplayMoney(usd, currency),
      convertUsd: usd => convertUsdToDisplayAmount(usd, currency),
      displayTotals: (subtotalUsd, shippingUsd) =>
        formatDisplayTotalsFromUsd(subtotalUsd, shippingUsd, currency),
    }),
    [currency, setCurrency]
  );

  return <ShopCurrencyContext.Provider value={value}>{children}</ShopCurrencyContext.Provider>;
}

export function useShopCurrency(): ShopCurrencyContextValue {
  const ctx = useContext(ShopCurrencyContext);
  if (!ctx) {
    throw new Error("useShopCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
