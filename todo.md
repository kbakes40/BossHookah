# Project TODO

## Demo Account System
- [x] Create Sign In page with demo login
- [x] Create Create Account page with demo registration
- [x] Create My Account dashboard page
- [x] Create Order History page with mock orders
- [x] Update Header navigation to link to new pages

## Member Perks Feature
- [x] Create Member Perks/Rewards page with Stars program
- [x] Add Ways to Earn section with icons
- [x] Add Ways to Redeem section
- [x] Add Referrals section with coupon benefits
- [x] Replace BACK TO TOP button with floating bag-with-heart icon
- [x] Make floating icon open Member Perks page

## UX Improvements
- [x] Add haptic vibration feedback when adding items to cart
- [x] Change floating rewards button background from green to white

## Bug Fixes
- [x] Fix mobile menu scrolling to allow access to Wholesale tab at bottom

## Feature Updates
- [x] Convert Member Perks to modal popup instead of separate page
- [x] Update hero slider buttons to navigate to collections (SHOP NOW -> Shisha, EXPLORE -> Hookahs)
- [x] Fix Premium Tobacco SHOP NOW button routing to Shisha collection

## New Features
- [x] Implement product quick view modal component
- [x] Integrate quick view with all product cards
- [x] Scrape charcoal products from thehookahshop.com
- [x] Filter and import only products with white background images (11 products)
- [x] Update charcoal collection with imported products

## UI Updates
- [x] Remove SALE badge overlays from product card images

## Product Updates
- [x] Reduce charcoal products to 4 unique options (removed extra green Coco Fuego products)
- [x] Remove Coco Nara product and reorder charcoal products by price (highest to lowest)
- [x] Remove quick view modal popup and restore original product card behavior

## Vapes Category Addition
- [x] Scrape 4 vape products with white backgrounds from thehookahshop.com (ordered by price highest to lowest)
- [x] Generate vape icon matching site theme
- [x] Add Vapes category to navigation menu
- [x] Create vape products data file and integrate with main products

## Bug Fixes
- [x] Fix 404 error on /vapes route by adding it to App.tsx router
- [x] Fix vape products not displaying on Vapes collection page
- [x] Fix haptic vibration not working when adding items to cart

## Analytics Integration
- [x] Add Google Analytics tracking code (G-NSDJ4NSEDH) to site

## SEO Optimization
- [x] Add meta keywords to homepage
- [x] Extend page title to 30-60 characters (now 79 chars)
- [x] Add meta description (50-160 characters - now 154 chars)

## Product Additions
- [x] Add Snoop x Al Fakher Shisha Tobacco 1kg to Shisha collection

## Bug Fixes
- [x] Fix mobile scroll issue - product pages should start at top, not bottom

## SEO Improvements
- [x] Reduce meta keywords from 10 to 6 focused terms
- [x] Update page title to 48 characters (within 30-60 range)

## Product Additions
- [x] Add remaining 4 Snoop x Al Fakher flavor variants (Cloud 92, Dogg's Delight, Midnight Blues, Money Honey)

## Wholesale Products
- [ ] Add RoR Tobacco 1kg products with all flavors to Wholesale collection ($1 less than retail)

## Navigation Redesign
- [x] Implement dropdown mega-menu for main navigation categories
- [x] Group Shisha products by brand (Al Fakher, ROR, etc.) in dropdown
- [x] Group Vapes products by brand (Breeze, Foger, Sky Bar) in dropdown
- [x] Group Charcoal products by brand (Coco Fuego, Starbuzz, Titanium) in dropdown
- [x] Create brand filtering pages (/shisha/brand-name, /vapes/brand-name, /charcoal/brand-name)
- [x] Add brand field to all product data (already exists)

## Design Updates
- [x] Create better vape icon matching neo-brutalism theme (more bold and graphic)

## Wholesale Products
- [x] Add all 41 RoR Tobacco 1kg flavors to Wholesale collection at $68.99 each
  - [x] Download and upload RoR Tobacco product image
  - [x] Create wholesale products data file with all 41 flavors
  - [x] Integrate wholesale products into main products array

## SEO Fixes
- [x] Extend page title from 29 to 30-60 characters (now 59 characters)

## UX Improvements
- [x] Increase dropdown hover delay so menu doesn't disappear too quickly
- [x] Consolidate 5 Snoop x Al Fakher products into single product with flavor selector
- [x] Add flavor variant selector to ProductCard component

## Product Card Improvements
- [x] Replace dropdown flavor selector with visible flavor buttons showing all options at once
