import { describe, expect, it } from "vitest";
import {
  cleanSkuForLookup,
  extractPriceFromHtml,
  extractUsdPrices,
  normalizeProductTitle,
  normalizeProductTitleForMatching,
  parseApprovedSiteResults,
} from "./costLookupService";

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

  it("normalizeProductTitleForMatching matches normalizeProductTitle", () => {
    expect(normalizeProductTitleForMatching("Breeze - Pro Banana", "Breeze")).toBe("Pro Banana");
  });

  it("extractPriceFromHtml pulls prices from HTML and JSON-like fragments", () => {
    expect(extractPriceFromHtml('<span class="money">$19.00</span>')).toContain(19);
    expect(extractPriceFromHtml('"price_min":"12.50"')).toContain(12.5);
  });

  it("parseApprovedSiteResults parses Shopify suggest JSON", () => {
    const json = JSON.stringify({
      resources: { results: { products: [{ title: "Test", url: "/products/x", price: "9.99", vendor: "V" }] } },
    });
    const items = parseApprovedSiteResults(json, "5starhookah.com");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Test");
    expect(items[0].link).toContain("5starhookah.com");
    expect(items[0].snippet).toContain("$9.99");
  });
});
