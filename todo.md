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

## Product Detail Page & Bug Fixes
- [x] Add flavor variant selector to product detail page
- [x] Fix nested anchor tag error in ProductCard component (already fixed - buttons are outside Link)

## Cart & Product Card Fixes
- [x] Remove flavor selector from product cards (only show on detail page)
- [x] Fix cart to track selected flavor variant separately (not group all flavors together)

## RoR Product Consolidation & Color Scheme Update
- [x] Research 5starhookah.com color scheme (primary, secondary, accent colors)
- [x] Consolidate 41 RoR Tobacco wholesale products into single product with flavor variants
- [x] Update global color scheme in index.css to match 5starhookah.com
- [x] Update component colors to match new scheme (automatic via CSS variables)

## Color Scheme Restoration
- [x] Restore original emerald green color scheme (#10B981)

## RoR Product Image Updates
- [x] Extract flavor-specific images from 5starhookah.com RoR product page (31 images found, will use main logo for unmapped flavors)
- [x] Update RoR product variants with individual flavor images
- [x] Update ProductDetail page to switch main image when flavor is selected

## Legal Compliance Updates
- [x] Update Terms and Conditions with Google Analytics disclosure
- [x] Add privacy policy information for GDPR/CCPA compliance

## Terms Page Rewrite
- [x] Rewrite Terms and Conditions to match reference format from 5starhookah.com
- [x] Change branding from 5Star Hookah to Boss Hookah
- [x] Create unique contact address and email (8342 Melrose Avenue, Los Angeles, CA 90069, info@bosshookah.com)

## Domain Update
- [x] Change bosshookah.com to bosshookah.site in Terms and Conditions (15 replacements)

## Starbuzz Mini Hookah Product
- [x] Extract product details and all color options from shopstarbuzz.com (9 colors found)
- [x] Create Starbuzz Mini product with color variants (like Snoop/RoR pattern)
- [x] Add color-specific images for each variant (9 colors with images from shopstarbuzz.com)

## Starbuzz Mini Image Fix
- [x] Fix Starbuzz Mini product images not displaying (downloaded and hosted locally)
- [x] Verify all 9 color variant images load correctly

## Price Display Standardization
- [x] Remove salePrice from Starbuzz Mini product (show only $139.99)
- [x] Ensure consistent price display format across all products

## Starbuzz Mini Color Mapping Fix
- [x] Identify correct color for each downloaded image file
- [x] Remap images to correct color variants (fixed: bright-pink was cyan, gunmetal was pink, antique-bronze was red, marsala-red was bronze)

## Starbuzz Mini Lime Green Image Update
- [x] Replace lime-green.png with user-provided lime green hookah image

## SEO Improvements
- [ ] Fix homepage title length (currently 29 chars, needs 30-60 chars)

## Starbuzz Mini Ultramarine Blue Image Update
- [x] Replace ultramarine-blue.png with user-provided ultramarine blue hookah image

## Product Bundle Deals
- [x] Update Starbuzz Mini hookah price from $139.99 to $149.99
- [x] Create Complete Starter Kit bundles (Hookah + Tobacco + Charcoal) - 3 tiers: Classic ($179.99), Premium ($199.99), Deluxe ($229.99)
- [x] Add bundle products to Bundles collection

## Remove Bundle Products
- [x] Remove bundle products import from products.ts
- [x] Delete bundle-products.ts file

## Hero Slider Auto-Cycling
- [x] Add auto-play to homepage hero slider (cycle every 5 seconds)
- [x] Auto-play resets on user interaction (interval restarts after manual navigation)

## Hero Slider Enhancements
- [x] Add 3 new colorful hero slides showcasing different product categories (Snoop Collection - purple, Wholesale Deals - red, Starbuzz Mini - blue)
- [x] Slow down auto-cycling from 5 seconds to 7 seconds

## Product Removal
- [x] Remove Luxury Hookah Set ($299.99) from products.ts

## Bug Fixes
- [x] Fix sign-in menu overlay covering Wholesale icon on desktop

## Hero Slider Enhancements
- [x] Add text glow effect to hero slide titles (inspired by davincidynamics.ai)
- [x] Add hover pop/scale effect to slide content

## Hero Slider Improvements
- [x] Change text shadow from emerald green to white
- [x] Make entire slide clickable (not just button)

## Hero Slider Refinements
- [x] Reduce text glow effect to be very subtle (barely noticeable)
- [x] Further reduce text glow to be even more minimal

## Starbuzz Mini Color Fixes
- [x] Swap Vibrant Orange and Gunmetal images (colors are mismatched)

## Product Detail UX Improvements
- [x] Add auto-scroll to top when color variant is selected (show selected color image)
- [x] Disable auto-scroll for shisha tobacco flavor selection (keep scroll only for hookah colors)

## SEO Improvements
- [x] Fix homepage title to be 30-60 characters (now 46 characters)
