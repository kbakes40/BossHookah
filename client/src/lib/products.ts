// Product data structure for the e-commerce site
// Design Philosophy: Neo-Brutalism meets Luxury Retail
import { charcoalProducts } from './charcoal-products';
import { vapeProducts } from './vape-products';

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice?: number;
  category: string;
  image: string;
  badge?: string;
  inStock: boolean;
  featured?: boolean;
  trending?: boolean;
}

export const categories = [
  { id: 'hookahs', name: 'Hookahs', icon: '🫖' },
  { id: 'shisha', name: 'Shisha', icon: '🍃' },
  { id: 'charcoal', name: 'Charcoal', icon: '⚫' },
  { id: 'vapes', name: 'Vapes', icon: '/images/icons/vape-icon.png' },
  { id: 'accessories', name: 'Accessories', icon: '🔧' },
  { id: 'bowls', name: 'Hookah Bowls', icon: '🥣' },
];

export const products: Product[] = [
  // Shisha/Tobacco Products
  { id: '1', name: 'Premium Tobacco Blend 250g', brand: 'Luxury Brand', price: 19.99, category: 'shisha', image: '/images/hWG7feLP4G9A.webp', badge: 'TRENDING', inStock: true, trending: true },
  { id: '2', name: 'Classic Tobacco 250g', brand: 'Heritage', price: 14.99, category: 'shisha', image: '/images/PICmJfphbkW2.jpg', badge: 'TRENDING', inStock: true, trending: true },
  { id: '3', name: 'Blonde Leaf Tobacco 250g', brand: 'Premium', price: 17.99, category: 'shisha', image: '/images/5RRmLYAQuT6v.png', badge: 'TRENDING', inStock: true, trending: true },
  { id: '4', name: 'Signature Tobacco 250g', brand: 'Elite', price: 19.99, category: 'shisha', image: '/images/hWG7feLP4G9A.webp', badge: 'TRENDING', inStock: true, trending: true },
  { id: '5', name: 'Traditional Tobacco 250g', brand: 'Classic', price: 17.99, category: 'shisha', image: '/images/PICmJfphbkW2.jpg', badge: 'TRENDING', inStock: true, trending: true },
  { id: '6', name: 'Light Tobacco 100g', brand: 'Smooth', price: 10.99, salePrice: 9.99, category: 'shisha', image: '/images/5RRmLYAQuT6v.png', badge: 'SALE', inStock: true, trending: true },
  { id: '50', name: 'Snoop x Al Fakher - Tha G\'z Mix 1kg', brand: 'Al Fakher', price: 64.99, category: 'shisha', image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/vkrqOhGKCSEelOUP.jpg', badge: 'NEW', inStock: true, featured: true },
  { id: '51', name: 'Snoop x Al Fakher - Cloud 92 1kg', brand: 'Al Fakher', price: 64.99, category: 'shisha', image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/vkrqOhGKCSEelOUP.jpg', badge: 'NEW', inStock: true, featured: true },
  { id: '52', name: 'Snoop x Al Fakher - Dogg\'s Delight 1kg', brand: 'Al Fakher', price: 64.99, category: 'shisha', image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/vkrqOhGKCSEelOUP.jpg', badge: 'NEW', inStock: true, featured: true },
  { id: '53', name: 'Snoop x Al Fakher - Midnight Blues 1kg', brand: 'Al Fakher', price: 64.99, category: 'shisha', image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/vkrqOhGKCSEelOUP.jpg', badge: 'NEW', inStock: true, featured: true },
  { id: '54', name: 'Snoop x Al Fakher - Money Honey 1kg', brand: 'Al Fakher', price: 64.99, category: 'shisha', image: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/vkrqOhGKCSEelOUP.jpg', badge: 'NEW', inStock: true, featured: true },
  
  // Hookahs
  { id: '7', name: 'Luxury Hookah Set', brand: 'Premium', price: 299.99, category: 'hookahs', image: '/images/5Ws20RGhEkJh.jpg', inStock: false, featured: true },
  { id: '8', name: 'Modern Glass Hookah', brand: 'Contemporary', price: 549.99, category: 'hookahs', image: '/images/YYJ0jfpn8sr2.jpg', inStock: true, featured: true },
  { id: '9', name: 'Traditional Brass Hookah', brand: 'Heritage', price: 399.99, category: 'hookahs', image: '/images/osJ2wAX3W81I.jpg', inStock: true, featured: true },
  { id: '10', name: 'Designer Hookah Premium', brand: 'Elite', price: 651.99, category: 'hookahs', image: '/images/5Ws20RGhEkJh.jpg', inStock: true, featured: true },
  
  // Accessories
  { id: '11', name: 'Premium Charcoal Holder', brand: 'Essential', price: 29.99, category: 'accessories', image: '/images/WDVKxXHEP5m8.jpg', inStock: true },
  
  // Charcoal products imported from charcoal-products.ts
  ...charcoalProducts,
  
  // Vape products imported from vape-products.ts
  ...vapeProducts,
  
  // Bowls
  { id: '15', name: 'Ceramic Bowl Premium', brand: 'Artisan', price: 49.99, category: 'bowls', image: '/images/osJ2wAX3W81I.jpg', inStock: true },
  { id: '16', name: 'Silicone Bowl Modern', brand: 'Tech', price: 39.99, category: 'bowls', image: '/images/YYJ0jfpn8sr2.jpg', inStock: true },
];

export const getTrendingProducts = () => products.filter(p => p.trending);
export const getFeaturedProducts = () => products.filter(p => p.featured);
export const getProductsByCategory = (category: string) => products.filter(p => p.category === category);
export const getProductById = (id: string) => products.find(p => p.id === id);
export const getBrandsByCategory = (category: string) => {
  const categoryProducts = products.filter(p => p.category === category);
  const brands = Array.from(new Set(categoryProducts.map(p => p.brand)));
  return brands.sort();
};
export const getProductsByCategoryAndBrand = (category: string, brand: string) => 
  products.filter(p => p.category === category && p.brand === brand);
