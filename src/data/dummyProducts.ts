import dummyProductsJson from "../../data/dummy-products.json";
import { Product } from "./products";

const categoryImages: Record<string, string> = {
  "Makanan Ringan": "/dummy-products/snack.svg",
  Minuman: "/dummy-products/drink.svg",
  "Mi Instan": "/dummy-products/noodle.svg",
  "Bumbu Dapur": "/dummy-products/sauce.svg",
  "Perawatan Rumah": "/dummy-products/home-care.svg",
  "Perawatan Diri": "/dummy-products/personal-care.svg",
  "Produk Bayi": "/dummy-products/baby.svg",
  "Susu & Dairy": "/dummy-products/dairy.svg",
  Biskuit: "/dummy-products/biscuit.svg",
  Sembako: "/dummy-products/staple.svg",
};

export const DUMMY_PRODUCTS = (dummyProductsJson as Product[]).map((product) => ({
  ...product,
  image:
    product.image && product.image !== "/placeholder.svg"
      ? product.image
      : categoryImages[product.category] || "/placeholder.svg",
}));
