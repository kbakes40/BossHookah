// Vape Products - Imported from thehookahshop.com (white backgrounds only)
// Ordered by price from highest to lowest

import { Product } from "./products";

export const vapeProducts: Product[] = [
  {
    id: "vape-001",
    name: "Breeze Prime Edition 6000 Puffs",
    brand: "Breeze",
    price: 26.99,
    salePrice: undefined,
    image: "/images/vapes/breeze-prime-edition-6000.png",
    category: "vapes",
    inStock: true,
  },
  {
    id: "vape-003",
    name: "Breeze Prime Disposable Vape",
    brand: "Breeze",
    price: 24.99,
    salePrice: undefined,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/QhlbNTilFboeMZAE.jpeg",
    category: "vapes",
    inStock: true,
    description: "Experience the ultimate vaping satisfaction with the Breeze Prime Edition Disposable Vape. Featuring up to 6000 puffs powered by a robust 1500mAh battery with advanced mesh coil technology and LED battery indicator. Pre-filled with 10ml of premium e-liquid at 5% salt nicotine strength.",
    variants: [
      { id: "bp-blueberry-lemon", name: "Blueberry Lemon", description: "A delightful burst of tart lemon meets the sweet undertones of blueberry" },
      { id: "bp-cherry-lemon", name: "Cherry Lemon", description: "Zesty punch of lemon combined with rich and succulent notes of cherry" },
      { id: "bp-coconut-banana", name: "Coconut Banana", description: "Tropical journey with the creaminess of coconut and the rich sweetness of bananas" },
      { id: "bp-honeydew-pineapple", name: "Honeydew Pineapple", description: "Tropical blend of juicy honeydew melon paired with the tang of ripe pineapple" },
      { id: "bp-lemon-cola", name: "Lemon Cola", description: "Classic sparkle of cola enhanced by a zing of lemon" },
      { id: "bp-mango", name: "Mango", description: "Pure, unadulterated mango goodness capturing the essence of sun-ripened mangoes" },
      { id: "bp-mint", name: "Mint", description: "Pure, chilling embrace of mint leaving your mouth feeling invigorated and fresh" },
      { id: "bp-peach-berry", name: "Peach Berry", description: "Harmonious blend where velvety sweetness of peaches meets vibrant notes of assorted berries" },
      { id: "bp-strawberry-apple", name: "Strawberry Apple", description: "Crispness of freshly picked apples melded with the gentle sweetness of strawberries" },
      { id: "bp-strawberry-mint", name: "Strawberry Mint", description: "Classic sweetness of strawberries with a cool and refreshing twist of mint" }
    ]
  },
  {
    id: "vape-002",
    name: "Breeze Pro",
    brand: "Breeze",
    price: 21.99,
    salePrice: undefined,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/CICXHOSgXsgSBbhJ.jpg",
    category: "vapes",
    inStock: true,
  },
];
