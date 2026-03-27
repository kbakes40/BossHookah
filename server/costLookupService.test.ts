import { describe, expect, it } from "vitest";
import { cleanSkuForLookup, extractUsdPrices, normalizeProductTitle } from "./costLookupService";

describe("costLookupService", () => {
  it("extractUsdPrices finds dollar amounts", () => {
    expect(extractUsdPrices("Sale $12.99 plus tax")).toEqual([12.99]);
    expect(extractUsdPrices("$10 $20")).toEqual([10, 20]);
  });

  it("cleanSkuForLookup strips catalog prefix", () => {
    expect(cleanSkuForLookup("catalog:ABC12345")).toBe("ABC12345");
    expect(cleanSkuForLookup("AB")).toBe("AB");
    expect(cleanSkuForLookup(null)).toBe(null);
  });

  it("normalizeProductTitle removes leading Brand — title prefix", () => {
    expect(normalizeProductTitle("Breeze - Pro Banana", "Breeze")).toBe("Pro Banana");
  });
});
