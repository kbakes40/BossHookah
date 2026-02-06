// Wholesale RoR Tobacco Products - 1kg packages at wholesale pricing
// All flavors priced at $68.99 ($1 less than retail $69.99)

import { Product } from "./products";

const rorFlavors = [
  "Blueberry",
  "Blueberry Mint",
  "Blueberry Spice",
  "Chai Latte",
  "Cinnamon",
  "Double Apple",
  "Duo Meloney",
  "Frozen",
  "Frozen Cherry Berry",
  "Grape Mint",
  "Guava",
  "Gum Mint",
  "Hedonism",
  "Ice Blue Mint",
  "Kiwi",
  "Lemon Meringue",
  "Lemon Mint",
  "Lime Lights",
  "Mango",
  "Mi Punch",
  "Mint Avalanche",
  "Minty Choco Glacier",
  "Mintylicious",
  "Moonshine",
  "Narco Mint",
  "Orange",
  "Orangina Fizz",
  "Pineapple",
  "Pink Potion",
  "Raspberry Lemonade",
  "Ruby Red",
  "Sckittel's Crush",
  "Sexy Senorita",
  "Strawberry",
  "Slush",
  "Toot",
  "Vanilla",
  "White Peach",
  "Watermelon",
  "Watermelon Mint",
  "Yummy Gummy"
];

export const wholesaleProducts: Product[] = rorFlavors.map((flavor, index) => ({
  id: `ror-${flavor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name: `ROR Tobacco 1kg - ${flavor}`,
  price: 68.99,
  image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663313071830/nltwSZTGdVdVTHiX.jpg",
  category: "wholesale",
  brand: "ROR",
  inStock: true,
  isNew: false,
  isFeatured: false
}));
