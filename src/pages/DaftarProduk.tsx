// React & Router
import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Link } from "react-router-dom";

// External Libraries & Icons
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

// UI Components
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useAuth } from "@/hooks/use-auth";
import { useDistributorApproval } from "@/hooks/use-distributor-approval";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";

// Utils, Data & API
import { Product, ProductVariant } from "@/data/products";
import { formatIDR, generateProductSlug } from "@/lib/utils";
import { addPDFHeader, addPDFFooter } from "@/utils/pdf-utils";
import { translations } from "@/lib/translations";
import {
  getAllProducts,
  getAllAreas,
  getAllBrands,
  fetchProductsWithVariants,
  fetchProductsExpandedByVariants,
  ProductWithVariant,
} from "@/services/product-service";
import { generateCatalogPDF } from "@/utils/catalog";
import { checkMixedVariantsMOQ } from "@/utils/mixVariants";
import {
  trackCatalogExport,
  trackDeniedCatalogExport,
} from "@/utils/analytics";

// Integrations & Types
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContextDefinition";
import { User } from "@/contexts/AuthContextDefinition";
import { safeNumber, safeString } from "@/utils/catalog/Funtions";

// Cache duration constant
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const ProductCard = React.memo(
  ({
    product,
    loggedIn,
    user,
    selectedFilterArea = "",
  }: {
    product: ProductWithVariant;
    loggedIn: boolean;
    user: User | null;
    selectedFilterArea?: string;
  }) => {
    // Get cart functions and items
    const { addItem, items } = useCart();
    const { toast } = useToast();
    const { lang } = useLanguage();
    const t = translations[lang];

    // Get distributor approval status
    const distributorAccess = useDistributorApproval();

    // If a filter area is selected and product has that area, use it as default
    const initialSelectedArea = (() => {
      if (
        selectedFilterArea &&
        product.regions.some((r) => r.area === selectedFilterArea)
      ) {
        return selectedFilterArea;
      }
      return product.regions[0]?.area || "";
    })();

    const [selectedArea, setSelectedArea] = useState(initialSelectedArea);

    // Find the regional pricing based on selected area
    const regional =
      product.regions.find((r) => r.area === selectedArea) ||
      product.regions[0];
    const basePrice = regional?.distributorPrice ?? product.distributorPrice;
    const usedMoq = regional?.moq ?? product.moq;

    // Determine if this product allows mixing variants to meet MOQ
    // IMPORTANT: Make absolutely sure we're checking correctly - use explicit boolean checks
    const allowMixVariants = Boolean(
      regional?.allowMixVariants === true || product.allowMixVariants === true
    );
    const skuLevelMoq = Number(
      regional?.skuLevelMoq || product.singleSkuMoq || 0
    );

    // Display regular MOQ only (no conversions or SKU-level mixing)
    const displayMoq = usedMoq;

    // Debug logging for MOQ inconsistency issue
    if (product.name.includes('Suno') || product.name.includes('Tobelo')) {
      console.log(`[MOQ DEBUG] ${product.name}:`, {
        productMoq: product.moq,
        regionalMoq: regional?.moq,
        usedMoq,
        allowMixVariants,
        skuLevelMoq,
        displayMoq,
        selectedArea,
        regionCount: product.regions.length
      });
    }

    // UOM conversion properties (not displayed on frontend)
    const moqUom =
      product.moq_uom && product.moq_uom !== "pcs"
        ? product.moq_uom
        : regional?.moq_uom || "pcs";
    const pricingUom =
      product.pricing_uom && product.pricing_uom !== "pcs"
        ? product.pricing_uom
        : regional?.price_uom || "pcs";
    const baseUom = product.base_uom || "pcs";

    // UOM conversion factors (for backend processing/calculations)
    const moqConversionFactor =
      product.moq_conversion_factor || regional?.moq_conversion_factor || 1;
    const pricingConversionFactor =
      product.pricing_conversion_factor ||
      regional?.pricing_conversion_factor ||
      1;
    const baseConversionFactor = product.base_conversion_factor || 1;

    // Conversion ratios for UOM calculations
    const uomConversions = {
      moq: {
        uom: moqUom,
        factor: moqConversionFactor,
        convertedQuantity: usedMoq * moqConversionFactor,
      },
      pricing: {
        uom: pricingUom,
        factor: pricingConversionFactor,
        convertedPrice: basePrice / pricingConversionFactor,
      },
      base: {
        uom: baseUom,
        factor: baseConversionFactor,
      },
    };

    // Helper function to check how many more items are needed to reach MOQ
    const getMixedVariantsStatus = () => {
      if (!allowMixVariants || !product.isVariant || !skuLevelMoq) return null;

      const { hasEnoughItems, currentTotal, neededToReachMOQ } =
        checkMixedVariantsMOQ(
          items,
          product.baseProductId,
          regional?.area || "",
          skuLevelMoq
        );

      return {
        hasEnoughItems,
        currentTotal,
        neededToReachMOQ,
        skuLevelMoq,
      };
    };

    // Initialize quantity state - if mixed variants are allowed, always start with 1
    // otherwise use the standard MOQ
    // Force the condition check to be explicit to avoid falsy/truthy issues
    const canMixVariants = Boolean(
      allowMixVariants === true && product.isVariant === true
    );
    const initialQty = canMixVariants ? 1 : usedMoq;
    const [qty, setQty] = useState(initialQty);

    // Update area and quantity if filter area changes
    useEffect(() => {
      if (
        selectedFilterArea &&
        product.regions.some((r) => r.area === selectedFilterArea)
      ) {
        setSelectedArea(selectedFilterArea);
        const newRegional =
          product.regions.find((r) => r.area === selectedFilterArea) ||
          product.regions[0];
        const newMoq = newRegional?.moq ?? product.moq;
        setQty((prev) => Math.max(prev, newMoq));
      }
    }, [selectedFilterArea, product.regions, product.moq]);

    // Add to cart handler
    const handleAddToCart = () => {
      let finalQty = qty;
      let moqMessage = "";

      if (allowMixVariants && skuLevelMoq > 0 && product.isVariant) {
        const { hasEnoughItems, currentTotal } = checkMixedVariantsMOQ(
          items,
          product.baseProductId,
          regional?.area || "",
          skuLevelMoq
        );

        const newTotal = currentTotal + qty;

        if (hasEnoughItems || newTotal >= skuLevelMoq) {
          moqMessage =
            lang === "id"
              ? ` (Total varian: ${newTotal}/${skuLevelMoq})`
              : ` (Total variants: ${newTotal}/${skuLevelMoq})`;
        } else {
          const stillNeeded = skuLevelMoq - newTotal;
          moqMessage =
            lang === "id"
              ? ` (${newTotal}/${skuLevelMoq}, perlu ${stillNeeded} lagi)`
              : ` (${newTotal}/${skuLevelMoq}, need ${stillNeeded} more)`;
        }

        finalQty = qty;
      } else if (qty < usedMoq) {
        finalQty = usedMoq;
      }

      addItem({
        id: product.baseProductId,
        name: product.name,
        size: product.size,
        image: product.image,
        province: regional?.area || "",
        unitPrice: basePrice,
        moq: usedMoq,
        qty: finalQty,
        consumerPrice: product.consumerPrice,
        skuLevelMoq: allowMixVariants ? skuLevelMoq : undefined,
        allowMixVariants: allowMixVariants,
        variant:
          product.isVariant && product.variantInfo
            ? {
                id: product.variantInfo.id,
                name: product.variantInfo.variantName,
                additionalPrice: product.variantInfo.additionalPrice,
              }
            : undefined,
        uomConversions: uomConversions,
        selectedUoms: {
          moq: moqUom,
          pricing: pricingUom,
          base: baseUom,
        },
      });

      toast({
        title: `${product.displayName} ${product.size}`,
        description:
          lang === "id"
            ? `${finalQty} item ditambahkan ke keranjang${moqMessage}`
            : `${finalQty} items added to cart${moqMessage}`,
        duration: 3000,
      });
    };

    const canAddToCart =
      distributorAccess.canPlaceOrders &&
      basePrice > 0 &&
      regional &&
      user?.profileComplete === true;

    // Calculate margin and profit for a single unit to avoid qty-related issues
    const unitProfit = Math.max(0, product.consumerPrice - basePrice);
    const unitMargin =
      product.consumerPrice > 0
        ? (unitProfit / product.consumerPrice) * 100
        : 0;

    // Also calculate total values based on quantity
    const subtotalDistributor = qty * basePrice;
    const potentialRevenue = qty * product.consumerPrice;
    const profit = potentialRevenue - subtotalDistributor;
    const margin = potentialRevenue > 0 ? (profit / potentialRevenue) * 100 : 0;

    // Simplified card for non-logged-in or pending approval users
    if (!loggedIn || distributorAccess.isPending) {
      return (
        <article className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow h-full w-full flex flex-col">
          {/* Product Image with Area Badge */}
          <div className="relative w-full h-48 p-3">
            <img
              src={product.image || "/placeholder.svg"}
              alt={`${product.displayName} — ${product.size}`}
              loading="lazy"
              className="size-full object-cover"
            />
            {/* Area Badge - top right corner */}
            <div className="absolute top-3 right-3 bg-gray-600 text-white rounded px-2 py-1 text-xs font-medium">
              {regional?.area ?? "-"}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="p-3 flex-1 flex flex-col">
            {/* Brand Name */}
            {product.brand &&
              product.brand !== "unknown" &&
              product.brand !== "Unknown Brand" &&
              product.brand !== "Unknown" && (
                <div className="text-xs text-gray-600 mb-1">
                  {product.brand}
                </div>
              )}

            {/* Product Name with Variant */}
            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
              {product.name}
              {product.isVariant &&
                product.variantInfo &&
                ` ${product.variantInfo.variantName}`}
            </h3>

            {/* Category - SKU Variant */}
            <div className="text-xs text-gray-500 mb-3">
              {product.category &&
                product.category !== "unknown" &&
                product.category !== "Uncategorized" &&
                product.category}
              {product.isVariant && product.variantInfo && (
                <> - {product.variantInfo.variantName}</>
              )}
            </div>

            {/* Price Section - Blurred */}
            <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50 relative">
              <div className="text-xs text-gray-600 mb-2 blur-sm select-none">
                Harga per karton
              </div>

              {/* Distributor Price - Blurred with Orange Background */}
              <div className="mb-1 -mx-3 px-3 py-1.5 bg-orange-50 blur-sm select-none">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Distributor</span>
                  <span className="text-sm font-bold text-gray-900">
                    Rp 150,000
                  </span>
                </div>
              </div>

              {/* Retail Price - Blurred */}
              <div className="mb-1 blur-sm select-none">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Retail</span>
                  <span className="text-sm font-semibold text-gray-900">
                    Rp 180,000
                  </span>
                </div>
              </div>

              {/* Konsumen Price - Blurred */}
              <div className="blur-sm select-none">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Konsumen</span>
                  <span className="text-sm font-normal text-gray-900">
                    Rp 205,200
                  </span>
                </div>
              </div>
            </div>

            {/* Margin Display - Blurred */}
            <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50 blur-sm select-none">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  Margin (Distributor — Retail)
                </span>
                <span className="text-sm font-bold text-teal-600">30000%</span>
              </div>
            </div>

            {/* MOQ Info */}
            <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">MOQ</span>
                <span className="font-medium text-gray-900">
                  {displayMoq} karton
                </span>
              </div>
            </div>

            {/* Login/Approval Message */}
            <div className="mt-auto mb-3 p-3 bg-orange-50 border border-orange-300 rounded-md">
              <p className="text-xs text-orange-800 text-center font-medium">
                {!loggedIn
                  ? lang === "id"
                    ? "Silakan login untuk mengakses harga dan melakukan pemesanan."
                    : "Please login to access prices and place orders."
                  : lang === "id"
                  ? "Menunggu approval admin untuk mengakses harga dan melakukan pemesanan."
                  : "Waiting for admin approval to access prices and place orders."}
              </p>
            </div>
          </div>
        </article>
      );
    }

    // Card for active users with incomplete profile - show prices but can't order
    if (loggedIn && distributorAccess.canViewPrices && !user?.profileComplete) {
      return (
        <article className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
          {/* Product Image with Area Badge */}
          <div className="relative w-full h-48 p-3">
            <img
              src={product.image || "/placeholder.svg"}
              alt={`${product.displayName} — ${product.size}`}
              loading="lazy"
              className="size-full object-cover"
            />
            {/* Area Badge - top right corner */}
            <div className="absolute top-3 right-3 bg-gray-600 text-white rounded px-2 py-1 text-xs font-medium">
              {regional?.area ?? "-"}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="p-3 flex-1 flex flex-col">
            {/* Brand Name */}
            {product.brand &&
              product.brand !== "unknown" &&
              product.brand !== "Unknown Brand" &&
              product.brand !== "Unknown" && (
                <div className="text-xs text-gray-600 mb-1">
                  {product.brand}
                </div>
              )}

            {/* Product Name with Variant */}
            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
              {product.name}
              {product.isVariant &&
                product.variantInfo &&
                ` ${product.variantInfo.variantName}`}
            </h3>

            {/* Category - SKU Variant */}
            <div className="text-xs text-gray-500 mb-3">
              {product.category &&
                product.category !== "unknown" &&
                product.category !== "Uncategorized" &&
                product.category}
              {product.isVariant && product.variantInfo && (
                <> - {product.variantInfo.variantName}</>
              )}
            </div>

            {/* Price Section - Visible for active users */}
            <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50">
              <div className="text-xs text-gray-600 mb-2">
                {lang === "id" ? "Harga per karton" : "Price per carton"}
              </div>

              {/* Distributor Price with Orange Background */}
              <div className="mb-1 -mx-3 px-3 py-1.5 bg-orange-50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">
                    {lang === "id" ? "Distributor" : "Distributor"}
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    {formatIDR(basePrice)}
                  </span>
                </div>
              </div>

              {/* Retail Price */}
              <div className="mb-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">
                    {lang === "id" ? "Retail" : "Retail"}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {product.retailPrice && product.retailPrice > 0
                      ? formatIDR(product.retailPrice)
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Konsumen Price */}
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">
                    {lang === "id" ? "Konsumen" : "Consumer"}
                  </span>
                  <span className="text-sm font-normal text-gray-900">
                    {formatIDR(product.consumerPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Margin Display */}
            <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  {lang === "id"
                    ? "Margin (Distributor — Retail)"
                    : "Margin (Distributor — Retail)"}
                </span>
                <span className="text-sm font-bold text-teal-600">
                  {unitMargin.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* MOQ Info */}
            <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">MOQ</span>
                <span className="font-medium text-gray-900">
                  {displayMoq} karton
                </span>
              </div>
            </div>

            {/* Complete Profile Message */}
            <div className="mt-auto mb-3 p-3 bg-blue-50 border border-blue-300 rounded-md">
              <p className="text-xs text-blue-800 text-center font-medium mb-2">
                {lang === "id"
                  ? "Lengkapi profil Anda untuk dapat memesan barang."
                  : "Complete your profile to place orders."}
              </p>
              <Link
                to="/profil"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded transition"
              >
                {lang === "id"
                  ? "Lengkapi Profil Disini"
                  : "Complete Profile Here"}
              </Link>
            </div>
          </div>
        </article>
      );
    }

    // Full card for logged-in and approved users
    return (
      <article className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Product Image with Area Badge */}
        <div className="relative w-full h-48 p-3">
          <img
            src={product.image || "/placeholder.svg"}
            alt={`${product.displayName} — ${product.size}`}
            loading="lazy"
            className="size-full object-cover"
          />
          {/* Area Badge - top right corner */}
          <div className="absolute top-3 right-3 bg-gray-600 text-white rounded px-2 py-1 text-xs font-medium">
            {regional?.area ?? "-"}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Brand Name */}
          {product.brand &&
            product.brand !== "unknown" &&
            product.brand !== "Unknown Brand" &&
            product.brand !== "Unknown" && (
              <div className="text-xs text-gray-600 mb-1">{product.brand}</div>
            )}

          {/* Product Name with Variant */}
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.name}
            {product.isVariant &&
              product.variantInfo &&
              ` ${product.variantInfo.variantName}`}
          </h3>

          {/* Category - SKU Variant */}
          <div className="text-xs text-gray-500 mb-3">
            {product.category &&
              product.category !== "unknown" &&
              product.category !== "Uncategorized" &&
              product.category}
            {product.isVariant && product.variantInfo && (
              <> - {product.variantInfo.variantName}</>
            )}
          </div>

          {/* Price Section */}
          <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50">
            <div className="text-xs text-gray-600 mb-2">
              {lang === "id" ? "Harga per karton" : "Price per carton"}
            </div>

            {/* Distributor Price with Orange Background */}
            <div className="mb-1 -mx-3 px-3 py-1.5 bg-orange-50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  {lang === "id" ? "Distributor" : "Distributor"}
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {formatIDR(basePrice)}
                </span>
              </div>
            </div>

            {/* Retail Price */}
            <div className="mb-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  {lang === "id" ? "Retail" : "Retail"}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {product.retailPrice && product.retailPrice > 0
                    ? formatIDR(product.retailPrice)
                    : "-"}
                </span>
              </div>
            </div>

            {/* Konsumen Price */}
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">
                  {lang === "id" ? "Konsumen" : "Consumer"}
                </span>
                <span className="text-sm font-normal text-gray-900">
                  {product.consumerPrice && product.consumerPrice > 0
                    ? formatIDR(product.consumerPrice)
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Margin Display */}
          <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">
                Margin (Distributor — Retail)
              </span>
              <span className="text-sm font-bold text-teal-600">
                {unitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* MOQ Info */}
          <div className="mb-3 -mx-3 px-3 py-2 bg-gray-50">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">MOQ</span>
              <span className="font-medium text-gray-900">
                {displayMoq} karton
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto grid grid-cols-2 gap-2">
            <Link
              to={`/produk/${generateProductSlug(product)}`}
              className="block"
            >
              <button className="w-full py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                Lihat Detail
              </button>
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full py-2.5 text-sm font-medium text-white rounded-md transition-colors flex items-center justify-center gap-2 ${
                canAddToCart
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </article>
    );
  }
);

// Loading skeleton component
const ProductCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden bg-white shadow-sm h-full flex flex-col animate-pulse">
    <div className="w-full h-48 bg-gray-200" />
    <div className="p-3 flex-1 flex flex-col space-y-3">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex-1" />
      <div className="h-8 bg-gray-200 rounded" />
    </div>
  </div>
);

export default function DaftarProduk() {
  const { user } = useAuth();
  const { items } = useCart();
  const { lang } = useLanguage();
  const t = translations[lang];
  const { toast } = useToast();

  // Get distributor approval status
  const distributorAccess = useDistributorApproval();

  // State for products and areas - updated to use ProductWithVariant
  const [products, setProducts] = useState<ProductWithVariant[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [errorInfo, setErrorInfo] = useState<string>("");
  const [areas, setAreas] = useState<string[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const [area, setArea] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [sortOrder, setSortOrder] = useState("price-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  // Add cache ref to prevent repeated API calls
  const dataCacheRef = useRef<{
    products: ProductWithVariant[] | null;
    timestamp: number;
  }>({ products: null, timestamp: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // Fetch products, areas and brands from Supabase when component mounts
  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const now = Date.now();
      const cache = dataCacheRef.current;
      if (cache.products && now - cache.timestamp < CACHE_DURATION) {
        setProducts(cache.products);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch products expanded by variants
        const productsData = await fetchProductsExpandedByVariants();

        // Update cache
        dataCacheRef.current = {
          products: productsData,
          timestamp: now,
        };

        setProducts(productsData);

        // Set debug info for display
        const variantCount = productsData.filter((p) => p.isVariant).length;
        setDebugInfo(
          `Total products: ${productsData.length}, Variants: ${variantCount}`
        );

        // Set fixed areas instead of fetching them
        const fixedAreas = [
          "Jabodetabek",
          "Jawa Barat",
          "Jawa Tengah",
          "Jawa Timur",
        ];
        setAreas(fixedAreas);

        // Fetch brands
        const brandsData = await getAllBrands();
        setAllBrands(brandsData);

        // Set initial area if user has a location
        if (user?.kota && fixedAreas.includes(user.kota)) {
          setArea(user.kota);
        }

        // Set price range based on actual products
        if (productsData.length > 0) {
          const prices = productsData.map((p) => p.consumerPrice);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          // Initialize with full range (min to max)
          setPriceRange([minPrice, maxPrice]);
          setMinPriceInput(minPrice.toString());
          setMaxPriceInput(maxPrice.toString());
        }
      } catch (error) {
        console.error("Error loading product data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.kota]);

  // Sync input display values when priceRange changes from external sources
  useEffect(() => {
    setMinPriceInput(priceRange[0].toString());
    setMaxPriceInput(priceRange[1].toString());
  }, [priceRange]); // Sync input display values when priceRange changes from external sources
  useEffect(() => {
    setMinPriceInput(priceRange[0].toString());
    setMaxPriceInput(priceRange[1].toString());
  }, [priceRange]); // Calculate nearest area from user's coordinates with useCallback to avoid recreation
  const findNearestArea = useCallback((latitude: number, longitude: number) => {
    // This is a simplified mapping of Indonesian cities to approximate coordinates
    const cityMapping: Record<string, [number, number, string]> = {
      // Jakarta area (Jabodetabek)
      "Jakarta Pusat": [-6.1751, 106.865, "Jabodetabek"],
      "Jakarta Selatan": [-6.2615, 106.8106, "Jabodetabek"],
      "Jakarta Barat": [-6.1683, 106.7588, "Jabodetabek"],
      "Jakarta Timur": [-6.2256, 106.9012, "Jabodetabek"],
      "Jakarta Utara": [-6.1339, 106.8823, "Jabodetabek"],
      "Kota Tangerang": [-6.1701, 106.6403, "Jabodetabek"],
      "Kota Bekasi": [-6.2349, 107.0003, "Jabodetabek"],
      "Kota Depok": [-6.4025, 106.7942, "Jabodetabek"],
      "Kota Bogor": [-6.5944, 106.7892, "Jabodetabek"],

      // Jawa Barat
      "Kota Bandung": [-6.9175, 107.6191, "Jawa Barat"],
      "Kota Cirebon": [-6.732, 108.5523, "Jawa Barat"],

      // Jawa Tengah
      "Kota Semarang": [-7.0051, 110.4381, "Jawa Tengah"],
      "Kota Yogyakarta": [-7.7971, 110.3688, "Jawa Tengah"],

      // Jawa Timur
      "Kota Surabaya": [-7.2575, 112.7521, "Jawa Timur"],
      "Kota Malang": [-7.9797, 112.6304, "Jawa Timur"],
    };

    let nearestArea = "Jabodetabek"; // Default to Jabodetabek
    let minDistance = Infinity;

    // Find the closest city by calculating distance
    Object.entries(cityMapping).forEach(([city, [lat, lng, area]]) => {
      // Simple distance calculation using Pythagorean theorem (not accurate for long distances)
      const distance = Math.sqrt(
        Math.pow(latitude - lat, 2) + Math.pow(longitude - lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestArea = area;
      }
    });

    return nearestArea;
  }, []);

  // Auto-detect location using useCallback to avoid recreation on each render
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(
        lang === "id"
          ? "Geolokasi tidak didukung oleh browser Anda"
          : "Geolocation is not supported by your browser"
      );
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearestArea = findNearestArea(latitude, longitude);

        if (nearestArea) {
          setArea(nearestArea);
        }
        setIsLocating(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? lang === "id"
              ? "Izin lokasi ditolak. Silakan izinkan akses lokasi untuk melihat produk di area Anda."
              : "Location permission denied. Please allow location access to see products in your area."
            : lang === "id"
            ? "Gagal mendeteksi lokasi Anda. Silakan pilih area secara manual."
            : "Failed to detect your location. Please select an area manually."
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [findNearestArea, setArea, lang]);

  // Check and request location permission when component mounts
  useEffect(() => {
    // Function to check if we already have a location permission
    const checkLocationPermission = async () => {
      try {
        // Check if the Permissions API is supported
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({
            name: "geolocation",
          });

          // Only prompt for location if the permission status is "prompt" (not yet decided)
          if (permissionStatus.state === "prompt") {
            detectUserLocation();
          }
        } else {
          // Fallback for browsers without Permissions API
          detectUserLocation();
        }
      } catch (error) {
        console.error("Error checking location permission:", error);
      }
    };

    // Only try to get location if no area is selected yet
    if (!area) {
      checkLocationPermission();
    }
  }, [area, detectUserLocation]); // Run only once on mount and if dependencies change

  // Price bounds are calculated from loaded products
  const priceBounds = useMemo<[number, number]>(() => {
    if (products.length === 0) return [0, 500000];
    const prices = products.map((p) => p.consumerPrice);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  // Filter products based on all criteria
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query (SKU, name, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.variantInfo?.variantName &&
            p.variantInfo.variantName.toLowerCase().includes(query)) ||
          (p.displayName && p.displayName.toLowerCase().includes(query))
      );
    }

    // Filter by area
    if (area) {
      filtered = filtered.filter((p) => p.regions.some((r) => r.area === area));
    }

    // Filter by brand
    if (selectedBrand) {
      filtered = filtered.filter((p) => p.brand === selectedBrand);
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) =>
        p.consumerPrice >= priceRange[0] && p.consumerPrice <= priceRange[1]
    );

    return filtered;
  }, [searchQuery, area, selectedBrand, priceRange, products]);

  // Pagination logic
  const paginationTotalPages = useMemo(
    () => Math.ceil(filteredProducts.length / productsPerPage),
    [filteredProducts, productsPerPage]
  );

  // Current page products
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [currentPage, filteredProducts, productsPerPage]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      searchQuery.trim() ||
      area ||
      selectedBrand ||
      priceRange[0] > 0 ||
      priceRange[1] < 1000000
    );
  }, [searchQuery, area, selectedBrand, priceRange]);

  // Export catalog function that respects filters
  const exportFilteredCatalog = async () => {
    // Check if user is logged in
    if (!user) {
      // Track the denied export attempt
      trackDeniedCatalogExport().catch((err) =>
        console.error("Failed to track denied catalog export:", err)
      );

      // Show error toast
      toast({
        title: lang === "id" ? "Akses Ditolak" : "Access Denied",
        description:
          lang === "id"
            ? "Silakan masuk terlebih dahulu untuk mengunduh katalog produk."
            : "Please sign in first to download the product catalog.",
        variant: "destructive",
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/masuk";
      }, 1500);

      return;
    }

    // Check distributor approval status
    if (!distributorAccess.canDownloadCatalog) {
      toast({
        title: lang === "id" ? "Akses Ditolak" : "Access Denied",
        description:
          lang === "id"
            ? "Akun Anda belum disetujui. Silakan tunggu persetujuan admin untuk mengunduh katalog."
            : "Your account is not yet approved. Please wait for admin approval to download catalogs.",
        variant: "destructive",
      });
      return;
    }

    try {
      let productsToExport: ProductWithVariant[];

      if (hasActiveFilters) {
        // Use filtered products if filters are active
        productsToExport = filteredProducts;
      } else {
        // Fetch ALL products from database if no filters are active
        const allProducts = await fetchProductsExpandedByVariants();
        productsToExport = allProducts;
      }

      // Generate the catalog with the appropriate product set
      const fileName = hasActiveFilters
        ? `baskit-catalog-filtered-${new Date().toISOString().slice(0, 10)}`
        : `baskit-catalog-complete-${new Date().toISOString().slice(0, 10)}`;

      await generateCatalogPDF({
        products: productsToExport,
        distributionArea: safeString(area, "Semua Area"),
        brand: safeString(selectedBrand, "Semua Brand"),
        priceRange: {
          min: safeNumber(priceBounds[0]),
          max: safeNumber(priceBounds[1]),
        },
        fileName: fileName,
        lang: lang === 'en' ? 'en' : 'id',
      });

      // Show success toast
      toast({
        title:
          lang === "id"
            ? "Katalog Berhasil Diunduh"
            : "Catalog Successfully Downloaded",
        description:
          lang === "id"
            ? `Katalog ${hasActiveFilters ? "terfilter" : "lengkap"} dengan ${
                productsToExport.length
              } produk berhasil diunduh`
            : `${hasActiveFilters ? "Filtered" : "Complete"} catalog with ${
                productsToExport.length
              } products successfully downloaded`,
      });
    } catch (error) {
      console.error("Error exporting catalog:", error);
      toast({
        title:
          lang === "id"
            ? "Gagal mengunduh katalog"
            : "Failed to download catalog",
        description:
          lang === "id"
            ? "Terjadi kesalahan saat mengunduh katalog"
            : "An error occurred while downloading the catalog",
        variant: "destructive",
      });
    }
  };

  // Baskit brand colors
  const COLORS = {
    tealGreen: [0, 104, 90], // #00685A - Primary color
    orange: [242, 101, 34], // #F26522 - Secondary color
    lime: [140, 198, 63], // #8CC63F - Accent color
    yellow: [253, 187, 48], // #FDBB30 - Accent color
    lightGray: [245, 245, 245], // #F5F5F5 - Background
    gray: [100, 100, 100], // #646464 - Text
    darkGray: [51, 51, 51], // #333333 - Dark text
    purple: [128, 90, 213], // #805AD5 - Variant color
  };

  // Utility function to calculate product card height based on variants
  const getItemHeight = (product: ProductWithVariant, baseHeight: number) => {
    if (product.isVariant) {
      // Add extra height for variant information section
      return baseHeight + 20;
    }
    return baseHeight;
  };

  // Helper function to draw a product card
  const drawProductCard = (
    pdf: jsPDF,
    product: ProductWithVariant,
    x: number,
    y: number,
    width: number,
    height: number,
    selectedArea: string
  ) => {
    const regional =
      product.regions.find((r) => r.area === selectedArea) ||
      product.regions[0];
    const usedPrice = regional?.distributorPrice ?? product.distributorPrice;
    const usedMoq = regional?.moq ?? product.moq;
    const margin =
      product.consumerPrice > 0
        ? ((product.consumerPrice - usedPrice) / product.consumerPrice) * 100
        : 0;

    // Calculate actual card height based on product
    const actualHeight = getItemHeight(product, height);

    // Create a clean product card with better shadow effect
    // Draw shadow
    pdf.setFillColor(230, 230, 230);
    pdf.roundedRect(x + 1.5, y + 1.5, width, actualHeight, 4, 4, "F");

    // Draw white box with proper border
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, width, actualHeight, 4, 4, "FD");

    // Draw the product image area with improved styling
    pdf.setFillColor(250, 250, 250); // Very light gray background for product
    pdf.roundedRect(x + 7, y + 7, width - 14, width - 14, 3, 3, "F");

    // Draw product brand logo area
    if (product.brand) {
      // Brand logo background
      pdf.setFillColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2],
        0.05
      );
      pdf.roundedRect(x + 7, y + 7, width - 14, 20, 3, 3, "F");

      // Brand name
      pdf.setTextColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2]
      );
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(product.brand.toUpperCase(), x + 12, y + 19);
    }

    // Draw product image placeholder with improved styling
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    if (product.displayName) {
      const nameLines = pdf.splitTextToSize(
        product.displayName.toUpperCase(),
        width - 24
      );
      pdf.text(nameLines, x + width / 2, y + width / 2 - 5, {
        align: "center",
      });
    }

    // Starting Y position for product details (below the image)
    const detailsY = y + width;

    // Add category badge with improved styling
    if (product.category) {
      pdf.setFillColor(
        COLORS.orange[0],
        COLORS.orange[1],
        COLORS.orange[2],
        0.1
      );
      pdf.setDrawColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.setFontSize(7);

      const categoryText = product.category;
      const categoryWidth =
        (pdf.getStringUnitWidth(categoryText) * 7) / pdf.internal.scaleFactor;

      // Draw badge background with better padding
      pdf.roundedRect(x + 7, detailsY + 3, categoryWidth + 10, 10, 3, 3, "FD");
      // Draw category text
      pdf.text(categoryText, x + 12, detailsY + 10);
    }

    // Product name with improved styling - use displayName for variants
    pdf.setTextColor(
      COLORS.tealGreen[0],
      COLORS.tealGreen[1],
      COLORS.tealGreen[2]
    );
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    // Split name if too long
    const nameLines = pdf.splitTextToSize(product.displayName, width - 14);
    pdf.text(nameLines, x + 7, detailsY + 20);

    // Product size/ID with better positioning - show variant info if it's a variant
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    let sizeText = `${product.size} • SKU: ${product.baseProductId}`;
    if (product.isVariant && product.variantInfo) {
      sizeText += `Variant: ${product?.variantInfo?.variantName}`;
    }
    pdf.text(sizeText, x + 7, detailsY + 20 + nameLines.length * 5 + 3);

    // If product is a variant, add a variant badge
    if (product.isVariant) {
      const variantText = "Variant Product";
      const textWidth =
        (pdf.getStringUnitWidth(variantText) * 7.5) / pdf.internal.scaleFactor;

      // Draw variant badge
      pdf.setFillColor(
        COLORS.purple[0],
        COLORS.purple[1],
        COLORS.purple[2],
        0.1
      );
      pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
      pdf.roundedRect(
        x + width - textWidth - 12,
        detailsY + 20 + nameLines.length * 5,
        textWidth + 8,
        10,
        2,
        2,
        "FD"
      );

      // Add variant text
      pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
      pdf.setFontSize(7);
      pdf.text(
        variantText,
        x + width - textWidth - 8,
        detailsY + 20 + nameLines.length * 5 + 7
      );
    }

    // Divider line with proper styling
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(0.7);
    pdf.line(x + 7, detailsY + 35, x + width - 7, detailsY + 35);

    // First row of details - with better vertical spacing
    const row1Y = detailsY + 45;

    // Left column - Distributor Price with improved styling
    pdf.setFillColor(
      COLORS.tealGreen[0],
      COLORS.tealGreen[1],
      COLORS.tealGreen[2],
      0.08
    );
    pdf.roundedRect(x + 7, row1Y - 5, width / 2 - 10, 25, 3, 3, "F");

    pdf.setFontSize(7);
    pdf.setTextColor(
      COLORS.darkGray[0],
      COLORS.darkGray[1],
      COLORS.darkGray[2]
    );
    pdf.setFont("helvetica", "normal");
    const distributorPriceUom =
      product.pricing_uom && product.pricing_uom !== "pcs"
        ? product.pricing_uom
        : regional?.price_uom || "pcs";
    const distributorLabel =
      distributorPriceUom !== "pcs"
        ? `Harga Distributor (per ${distributorPriceUom})`
        : "Harga Distributor";
    pdf.text(distributorLabel, x + 12, row1Y);

    pdf.setFontSize(10);
    pdf.setTextColor(
      COLORS.tealGreen[0],
      COLORS.tealGreen[1],
      COLORS.tealGreen[2]
    );
    pdf.setFont("helvetica", "bold");
    pdf.text(formatIDR(usedPrice), x + 12, row1Y + 10);

    // Right column - Customer Price with improved styling
    pdf.setFillColor(
      COLORS.orange[0],
      COLORS.orange[1],
      COLORS.orange[2],
      0.08
    );
    pdf.roundedRect(
      x + width / 2 + 3,
      row1Y - 5,
      width / 2 - 10,
      25,
      3,
      3,
      "F"
    );

    pdf.setFontSize(7);
    pdf.setTextColor(
      COLORS.darkGray[0],
      COLORS.darkGray[1],
      COLORS.darkGray[2]
    );
    pdf.setFont("helvetica", "normal");
    const consumerPriceUom = product.pricing_uom || "pcs";
    const consumerLabel =
      consumerPriceUom !== "pcs"
        ? `Harga Pelanggan (per ${consumerPriceUom})`
        : "Harga Pelanggan";
    pdf.text(consumerLabel, x + width / 2 + 8, row1Y);

    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatIDR(product.consumerPrice), x + width / 2 + 8, row1Y + 10);

    // Second row of details with better vertical spacing
    const row2Y = row1Y + 30;

    // Create grid layout for additional details
    const columnWidth = (width - 17) / 2;

    // Margin and MOQ with improved styling
    // Draw margin indicator with better color scheme
    let marginColor = [220, 53, 69]; // Red for low margin
    if (margin >= 30) {
      marginColor = [40, 167, 69]; // Green for high margin
    } else if (margin >= 15) {
      marginColor = COLORS.yellow; // Baskit yellow for medium margin
    }

    // Left column - Margin with color indicator and better styling
    pdf.setFillColor(marginColor[0], marginColor[1], marginColor[2], 0.08);
    pdf.roundedRect(x + 7, row2Y - 5, columnWidth, 20, 3, 3, "F");

    pdf.setFontSize(7);
    pdf.setTextColor(
      COLORS.darkGray[0],
      COLORS.darkGray[1],
      COLORS.darkGray[2]
    );
    pdf.text("Margin Distributor", x + 12, row2Y);

    pdf.setFontSize(9.5);
    pdf.setTextColor(marginColor[0], marginColor[1], marginColor[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${margin.toFixed(1)}%`, x + 12, row2Y + 10);

    // Right column - MOQ with improved styling
    pdf.setFillColor(
      COLORS.lightGray[0],
      COLORS.lightGray[1],
      COLORS.lightGray[2]
    );
    pdf.roundedRect(
      x + 7 + columnWidth + 3,
      row2Y - 5,
      columnWidth,
      20,
      3,
      3,
      "F"
    );

    pdf.setFontSize(7);
    pdf.setTextColor(
      COLORS.darkGray[0],
      COLORS.darkGray[1],
      COLORS.darkGray[2]
    );
    pdf.text("Min. Qty Pesanan", x + 12 + columnWidth + 3, row2Y);

    pdf.setFontSize(9.5);
    pdf.setTextColor(
      COLORS.darkGray[0],
      COLORS.darkGray[1],
      COLORS.darkGray[2]
    );
    pdf.setFont("helvetica", "bold");
    const moqUom =
      product.moq_uom && product.moq_uom !== "pcs"
        ? product.moq_uom
        : regional?.moq_uom || "pcs";
    pdf.text(`${usedMoq} ${moqUom}`, x + 12 + columnWidth + 3, row2Y + 10);

    // Third row - Area with improved styling
    const row3Y = row2Y + 25;

    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.setFont("helvetica", "normal");
    pdf.text("Area Distribusi", x + 7, row3Y);

    pdf.setFontSize(8);
    pdf.setTextColor(
      COLORS.darkGray[0],
      COLORS.darkGray[1],
      COLORS.darkGray[2]
    );
    pdf.setFont("helvetica", "bold");
    pdf.text(regional?.area || "Semua Area", x + 7, row3Y + 8);

    // Add variant information if product is a variant
    if (product.isVariant && product.variantInfo) {
      const row4Y = row3Y + 18;

      // Create a variant section header
      pdf.setFillColor(
        COLORS.purple[0],
        COLORS.purple[1],
        COLORS.purple[2],
        0.08
      );
      pdf.roundedRect(x + 7, row4Y - 3, width - 14, 15, 2, 2, "F");

      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
      pdf.setFont("helvetica", "bold");
      pdf.text("Variant Details:", x + 10, row4Y + 4);

      // Variant name and price
      pdf.setFontSize(6.5);
      pdf.setTextColor(
        COLORS.darkGray[0],
        COLORS.darkGray[1],
        COLORS.darkGray[2]
      );
      pdf.setFont("helvetica", "normal");

      const variantText = `• ${product.variantInfo.variantName}`;
      const priceText =
        product.variantInfo.additionalPrice > 0
          ? `+${formatIDR(product.variantInfo.additionalPrice)}`
          : "No extra charge";

      pdf.text(variantText, x + 10, row4Y + 11);

      // Add price info for the variant
      pdf.setTextColor(
        product.variantInfo.additionalPrice > 0
          ? COLORS.orange[0]
          : COLORS.tealGreen[0],
        product.variantInfo.additionalPrice > 0
          ? COLORS.orange[1]
          : COLORS.tealGreen[1],
        product.variantInfo.additionalPrice > 0
          ? COLORS.orange[2]
          : COLORS.tealGreen[2]
      );
      pdf.text(priceText, x + width - 40, row4Y + 11);
    }
  };

  const exportPDF = async () => {
    try {
      // Create PDF document
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Track catalog export for analytics
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user for analytics:", userError);
        } else if (userData?.user) {
          // Use the helper function to track the export
          await trackCatalogExport(
            userData.user.id,
            filteredProducts.length,
            area || "all",
            selectedBrand || null,
            priceRange
          );
        }
      } catch (error) {
        console.error("Error in catalog export analytics:", error);
      }

      // Group products by category
      const groupedProducts: Record<string, ProductWithVariant[]> = {};

      filteredProducts.forEach((product) => {
        const category = product.category || "Uncategorized";
        if (!groupedProducts[category]) {
          groupedProducts[category] = [];
        }
        groupedProducts[category].push(product);
      });

      // Create an elegant cover page
      // Create a clean white background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Add teal green header area at top
      pdf.setFillColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2]
      );
      pdf.rect(0, 0, pageWidth, 40, "F");

      // Add teal green footer area at bottom
      pdf.setFillColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2]
      );
      pdf.rect(0, pageHeight - 40, pageWidth, 40, "F");

      // Add modern side accent bar
      pdf.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.rect(0, 40, 15, pageHeight - 80, "F");

      // Add decorative elements - subtle pattern overlay
      for (let i = 0; i < 12; i++) {
        const opacity = 0.04;
        const size = 30;
        const xPos = (i % 4) * 60;
        const yPos = Math.floor(i / 4) * 60 + 50;

        pdf.setFillColor(
          COLORS.tealGreen[0],
          COLORS.tealGreen[1],
          COLORS.tealGreen[2],
          opacity
        );
        pdf.circle(pageWidth - xPos - 20, yPos, size, "F");
      }

      // Add diagonal accent line
      pdf.setDrawColor(
        COLORS.orange[0],
        COLORS.orange[1],
        COLORS.orange[2],
        0.3
      );
      pdf.setLineWidth(30);
      pdf.line(pageWidth, 0, 0, pageHeight);

      // Add main title block in the center with clean white background
      const titleBoxWidth = 160;
      const titleBoxHeight = 200;
      const titleBoxX = (pageWidth - titleBoxWidth) / 2;
      const titleBoxY = (pageHeight - titleBoxHeight) / 2 - 10;

      // Create white background for title box
      pdf.setFillColor(255, 255, 255, 0.9);
      pdf.roundedRect(
        titleBoxX,
        titleBoxY,
        titleBoxWidth,
        titleBoxHeight,
        6,
        6,
        "F"
      );

      // Add subtle border
      pdf.setDrawColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2],
        0.3
      );
      pdf.setLineWidth(1);
      pdf.roundedRect(
        titleBoxX + 3,
        titleBoxY + 3,
        titleBoxWidth - 6,
        titleBoxHeight - 6,
        4,
        4,
        "S"
      );

      // Add baskit logo and title in the center box
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(42);
      pdf.setTextColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2]
      );
      pdf.text("baskit", pageWidth / 2, titleBoxY + 50, { align: "center" });

      // Draw colored squares for the logo - larger for cover
      const logoSquareSize = 14;
      const logoSquareGap = 2;
      const logoX = pageWidth / 2 - (logoSquareSize * 2 + logoSquareGap) / 2;
      const logoY = titleBoxY + 60;

      // Draw logo squares with slight rounding
      const drawCoverSquare = (x: number, y: number, color: number[]) => {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(x, y, logoSquareSize, logoSquareSize, 2, 2, "F");
      };

      drawCoverSquare(logoX, logoY, COLORS.tealGreen);
      drawCoverSquare(
        logoX + logoSquareSize + logoSquareGap,
        logoY,
        COLORS.orange
      );
      drawCoverSquare(
        logoX + logoSquareSize + logoSquareGap,
        logoY + logoSquareSize + logoSquareGap,
        COLORS.lime
      );
      drawCoverSquare(
        logoX,
        logoY + logoSquareSize + logoSquareGap,
        COLORS.yellow
      );

      // Add title text with premium styling
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2]
      );
      pdf.text("PRODUCT", pageWidth / 2, titleBoxY + 115, { align: "center" });

      pdf.setFontSize(38);
      pdf.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.text("CATALOG", pageWidth / 2, titleBoxY + 145, { align: "center" });

      // Add area information with better styling
      const areaText = area || "Semua Area";
      pdf.setFillColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2],
        0.1
      );
      pdf.roundedRect(
        titleBoxX + 20,
        titleBoxY + 160,
        titleBoxWidth - 40,
        25,
        3,
        3,
        "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(
        COLORS.tealGreen[0],
        COLORS.tealGreen[1],
        COLORS.tealGreen[2]
      );
      pdf.text(areaText, pageWidth / 2, titleBoxY + 178, { align: "center" });

      // Add date with premium styling
      const formattedFullDate = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Add date box at bottom of title box
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(
        COLORS.darkGray[0],
        COLORS.darkGray[1],
        COLORS.darkGray[2]
      );
      pdf.text(formattedFullDate, pageWidth / 2, pageHeight / 2 + 110, {
        align: "center",
      });

      // Add product count information
      const productCountText = `${filteredProducts.length} ${
        lang === "id" ? "Produk" : "Products"
      }`;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "italic");
      pdf.text(productCountText, pageWidth / 2, pageHeight / 2 + 130, {
        align: "center",
      });

      // Add contact info in the footer area
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text("www.baskit-distributor.com", 25, pageHeight - 20);
      pdf.text(
        "info@baskit-distributor.com | +62 822 1234 5678",
        pageWidth - 25,
        pageHeight - 20,
        { align: "right" }
      );

      // Add first content page
      pdf.addPage();
      let yPosition = addPDFHeader(pdf, {
        title: "Product Catalog",
        subtitle: `${filteredProducts.length} Products`,
        area: area || "All Areas",
        customColors: {
          titleColor: [
            COLORS.tealGreen[0],
            COLORS.tealGreen[1],
            COLORS.tealGreen[2],
          ],
          areaColor: [COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]],
        },
        extraPadding: 5,
      });

      // For each category, add a section header and products
      let productCount = 0;
      for (const [category, products] of Object.entries(groupedProducts)) {
        // Skip to a new page if we're close to the bottom and it's not the first category
        if (yPosition > pageHeight - 50 && productCount > 0) {
          pdf.addPage();
          yPosition = addPDFHeader(pdf, {
            title: "Product Catalog",
            subtitle: `${filteredProducts.length} Products`,
            area: area || "All Areas",
          });
          yPosition += 10; // Add some padding after header
        }

        // Draw category header with improved styling
        const drawCategoryHeader = (
          pdf: jsPDF,
          category: string,
          y: number
        ) => {
          const headerHeight = 20;

          // Create an elegant gradient-style background
          pdf.setFillColor(
            COLORS.tealGreen[0],
            COLORS.tealGreen[1],
            COLORS.tealGreen[2],
            0.08
          );
          pdf.roundedRect(10, y, pageWidth - 20, headerHeight, 3, 3, "F");

          // Add left accent bar for visual interest
          pdf.setFillColor(
            COLORS.tealGreen[0],
            COLORS.tealGreen[1],
            COLORS.tealGreen[2]
          );
          pdf.rect(10, y, 4, headerHeight, "F");

          // Add subtle right decoration
          pdf.setFillColor(
            COLORS.orange[0],
            COLORS.orange[1],
            COLORS.orange[2],
            0.15
          );
          pdf.circle(pageWidth - 15, y + headerHeight / 2, 8, "F");

          // Add category text with better styling
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.setTextColor(
            COLORS.tealGreen[0],
            COLORS.tealGreen[1],
            COLORS.tealGreen[2]
          );
          pdf.text(category, 25, y + 14);

          // Add product count if available
          const productCount = groupedProducts[category]?.length || 0;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
          pdf.text(
            `${productCount} ${productCount === 1 ? "product" : "products"}`,
            pageWidth - 40,
            y + 14
          );

          return headerHeight;
        };

        // Add the category header
        const headerHeight = drawCategoryHeader(pdf, category, yPosition);

        yPosition += headerHeight + 10; // Space after category header

        let xPosition = 10;
        const startingYPosition = yPosition;

        // Calculate cards per row based on page width - improved spacing
        const itemsPerRow = 3;
        const marginBetweenItems = 8; // Increased spacing between items

        // Calculate dimensions with better proportions
        const availableWidth =
          pageWidth - 20 - (itemsPerRow - 1) * marginBetweenItems;
        const itemWidth = availableWidth / itemsPerRow;

        // Base height calculation
        const baseItemHeight = itemWidth + 80; // Base height for standard product

        // For layout calculation we use maximum height
        const itemHeight = itemWidth + 110; // Maximum possible height with variants

        // Add products for this category
        for (let i = 0; i < products.length; i++) {
          const product = products[i];

          // Calculate position
          const col = i % itemsPerRow;
          xPosition = 10 + col * (itemWidth + marginBetweenItems);

          // Check if we need a new row
          if (col === 0 && i > 0) {
            yPosition += itemHeight + 10;
          }

          // Check if we need a new page - with better spacing management
          if (yPosition + itemHeight > pageHeight - 30) {
            pdf.addPage();
            yPosition = addPDFHeader(pdf, {
              title: "Product Catalog",
              subtitle: `${filteredProducts.length} Products`,
              area: area || "All Areas",
              customColors: {
                titleColor: [
                  COLORS.tealGreen[0],
                  COLORS.tealGreen[1],
                  COLORS.tealGreen[2],
                ],
                areaColor: [
                  COLORS.orange[0],
                  COLORS.orange[1],
                  COLORS.orange[2],
                ],
              },
              extraPadding: 5,
            });
            yPosition += 10;
          }

          // Draw product card
          drawProductCard(
            pdf,
            product,
            xPosition,
            yPosition,
            itemWidth,
            baseItemHeight,
            area
          );

          productCount++;
        }

        // Move position to after this category's products
        if (products.length > 0) {
          const rowsForCategory = Math.ceil(products.length / itemsPerRow);
          yPosition =
            startingYPosition + rowsForCategory * (itemHeight + 10) + 20;
        }
      }

      // Add page numbers at the bottom
      const totalPdfPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPdfPages; i++) {
        pdf.setPage(i);
        addPDFFooter(pdf, i, totalPdfPages, {
          disclaimer: "Harga dan stok dapat berubah sewaktu-waktu",
          website: "www.baskit-distributor.com",
          showLogo: true,
          customColors: {
            footerColor: [
              COLORS.tealGreen[0],
              COLORS.tealGreen[1],
              COLORS.tealGreen[2],
            ],
          },
        });
      }

      // Create filename based on active filters
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      let filename = `baskit-catalog-${timestamp}`;
      if (area) filename += "-" + area.toLowerCase().replace(/\s+/g, "-");
      if (selectedBrand)
        filename += "-" + selectedBrand.toLowerCase().replace(/\s+/g, "-");
      filename += ".pdf";

      pdf.save(filename);

      // Show success notification
      toast({
        title:
          lang === "id"
            ? "Katalog Berhasil Diunduh"
            : "Catalog Successfully Downloaded",
        description:
          lang === "id"
            ? `Katalog produk ${
                area ? area + " " : ""
              }berhasil diunduh dengan ${filteredProducts.length} produk`
            : `${
                area ? area + " " : ""
              }Product catalog successfully downloaded with ${
                filteredProducts.length
              } products`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title:
          lang === "id"
            ? "Gagal mengunduh katalog"
            : "Failed to download catalog",
        description:
          lang === "id"
            ? "Terjadi kesalahan saat mengunduh katalog"
            : "An error occurred while downloading the catalog",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={
          lang === "id"
            ? "Daftar Produk | Baskit Distributor Hub"
            : "Product List | Baskit Distributor Hub"
        }
        description={
          lang === "id"
            ? "Lihat katalog produk Baskit, harga pelanggan, MOQ, dan harga distributor (setelah masuk)."
            : "View Baskit product catalog, customer prices, MOQ, and distributor prices (after login)."
        }
      />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-8 space-y-6 px-4">
        {/* Product List Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t.productList}</h1>
        </div>

        {/* Account Status Alert for logged-in users */}
        {user && !distributorAccess.isActive && (
          <Alert
            className={`border-${
              distributorAccess.statusColor === "yellow"
                ? "orange"
                : distributorAccess.statusColor
            }-200 bg-${
              distributorAccess.statusColor === "yellow"
                ? "orange"
                : distributorAccess.statusColor
            }-50`}
          >
            <div className="flex items-center gap-2">
              {distributorAccess.isPending && (
                <Clock className="h-4 w-4 text-orange-500" />
              )}
              {distributorAccess.isRejected && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {distributorAccess.isInactive && (
                <AlertTriangle className="h-4 w-4 text-gray-500" />
              )}
              <div className="flex-1">
                <AlertDescription className="text-sm font-medium">
                  {lang === "id"
                    ? distributorAccess.isPending
                      ? "Akun Anda sedang menunggu persetujuan admin. Anda dapat melihat produk namun tidak dapat mengakses harga atau melakukan pemesanan sampai akun disetujui."
                      : distributorAccess.isRejected
                      ? "Akun Anda telah ditolak. Silakan hubungi admin untuk informasi lebih lanjut."
                      : distributorAccess.isInactive
                      ? "Akun Anda tidak aktif. Silakan hubungi admin untuk mengaktifkan kembali akun Anda."
                      : "Status akun tidak diketahui. Silakan hubungi admin."
                    : distributorAccess.isPending
                    ? "Your account is pending admin approval. You can view products but cannot access prices or place orders until approved."
                    : distributorAccess.isRejected
                    ? "Your account has been rejected. Please contact admin for more information."
                    : distributorAccess.isInactive
                    ? "Your account is inactive. Please contact admin to reactivate your account."
                    : "Account status unknown. Please contact admin."}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Alert for non-logged-in users */}
        {!user && (
          <Alert className="border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <AlertDescription className="text-sm font-medium text-orange-800">
                  {lang === "id"
                    ? "Masuk untuk menggunakan simulasi dan melihat harga distributor."
                    : "Login to use simulation and view distributor prices."}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Search and Filter Panel - White background */}
        <div className="bg-white border rounded-lg p-6 shadow-sm space-y-6">
          {/* Search Bar */}
          <div>
            <Input
              type="text"
              placeholder={
                lang === "id" ? "Cari produk..." : "Search products..."
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Area Distribution Filter */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1.5 text-foreground">
                {lang === "id" ? "Area Distribusi" : "Area Distribusi"}
              </label>
              <select
                value={area}
                disabled={loading}
                onChange={(e) => {
                  setArea(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">
                  {lang === "id" ? "Semua Area" : "Semua Area"}
                </option>
                {["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1.5 text-foreground">
                Brand
              </label>
              <select
                value={selectedBrand}
                disabled={loading}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">
                  {lang === "id" ? "Semua Brand" : "Semua Brand"}
                </option>
                {allBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order Filter */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1.5 text-foreground">
                {lang === "id" ? "Urutkan" : "Urutkan"}
              </label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">
                  {lang === "id" ? "Urutkan" : "Urutkan"}
                </option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1.5 text-foreground">
                {lang === "id"
                  ? "Rentang Harga per Karton"
                  : "Rentang Harga per Karton"}
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    Rp
                  </span>
                  <input
                    type="text"
                    className={`w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm ${
                      isFilterLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    value={
                      minPriceInput
                        ? Number(minPriceInput).toLocaleString("id-ID")
                        : ""
                    }
                    onChange={(e) => {
                      if (isFilterLoading) return;
                      const inputValue = e.target.value.replace(/[^0-9]/g, "");
                      setMinPriceInput(inputValue);

                      const timeoutId = setTimeout(() => {
                        if (inputValue) {
                          const value = Number(inputValue);
                          const newMin = Math.max(priceBounds[0], value);
                          if (newMin <= priceRange[1]) {
                            setPriceRange([newMin, priceRange[1]]);
                            setCurrentPage(1);
                          }
                        } else {
                          setPriceRange([priceBounds[0], priceRange[1]]);
                          setCurrentPage(1);
                        }
                      }, 500);

                      return () => clearTimeout(timeoutId);
                    }}
                    onBlur={() => {
                      if (
                        !minPriceInput ||
                        Number(minPriceInput) < priceBounds[0]
                      ) {
                        setMinPriceInput(priceRange[0].toString());
                      }
                    }}
                    placeholder={priceBounds[0].toLocaleString("id-ID")}
                    disabled={isFilterLoading}
                  />
                  {isFilterLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
                <span className="text-sm">-</span>
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    Rp
                  </span>
                  <input
                    type="text"
                    className={`w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm ${
                      isFilterLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    value={
                      maxPriceInput
                        ? Number(maxPriceInput).toLocaleString("id-ID")
                        : ""
                    }
                    onChange={(e) => {
                      if (isFilterLoading) return;
                      const inputValue = e.target.value.replace(/[^0-9]/g, "");
                      setMaxPriceInput(inputValue);

                      const timeoutId = setTimeout(() => {
                        if (inputValue) {
                          const value = Number(inputValue);
                          const newMax = Math.min(priceBounds[1], value);
                          if (newMax >= priceRange[0]) {
                            setPriceRange([priceRange[0], newMax]);
                            setCurrentPage(1);
                          }
                        } else {
                          setPriceRange([priceRange[0], priceBounds[1]]);
                          setCurrentPage(1);
                        }
                      }, 500);

                      return () => clearTimeout(timeoutId);
                    }}
                    onBlur={() => {
                      if (
                        !maxPriceInput ||
                        Number(maxPriceInput) > priceBounds[1]
                      ) {
                        setMaxPriceInput(priceRange[1].toString());
                      }
                    }}
                    placeholder={priceBounds[1].toLocaleString("id-ID")}
                    disabled={isFilterLoading}
                  />
                  {isFilterLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Count and Download Catalog */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isFilterLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                <span>
                  {lang === "id"
                    ? "Memfilter produk..."
                    : "Filtering products..."}
                </span>
              </div>
            ) : (
              <>
                {lang === "id" ? "Menampilkan " : "Showing "}
                <span className="font-semibold text-foreground">
                  {filteredProducts.length}
                </span>
                {lang === "id" ? " produk" : " products"}
              </>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportFilteredCatalog}
                  disabled={!distributorAccess.canDownloadCatalog}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {lang === "id" ? "Unduh Katalog" : "Unduh Katalog"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {!user
                    ? lang === "id"
                      ? "Harap masuk untuk mengunduh katalog"
                      : "Please sign in to download catalog"
                    : !distributorAccess.canDownloadCatalog
                    ? lang === "id"
                      ? "Menunggu persetujuan admin untuk mengunduh katalog"
                      : "Waiting for admin approval to download catalog"
                    : lang === "id"
                    ? "Unduh katalog produk"
                    : "Download product catalog"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Informational text for non-logged-in or pending users */}
        {!user && (
          <p className="text-muted-foreground text-sm italic">
            {lang === "id"
              ? "Masuk untuk mengakses harga distributor dan fitur pemesanan."
              : "Login to access distributor prices and ordering features."}
          </p>
        )}
        {user && !distributorAccess.isActive && (
          <p className="text-muted-foreground text-sm italic">
            {lang === "id"
              ? "Harga distributor dan fitur pemesanan akan tersedia setelah akun Anda disetujui admin."
              : "Distributor prices and ordering features will be available after your account is approved by admin."}
          </p>
        )}

        {/* Alert for active users with incomplete profile */}
        {user && distributorAccess.isActive && !user.profileComplete && (
          <Alert className="bg-orange-50 border-orange-300">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-orange-800 font-medium">
                {lang === "id"
                  ? "Lengkapi profil Anda untuk dapat memesan produk."
                  : "Complete your profile to be able to order products."}
              </span>
              <Link to="/lengkapi-profil">
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white ml-4"
                >
                  {lang === "id"
                    ? "Lengkapi Profil Disini"
                    : "Complete Profile Here"}
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div ref={ref} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading || isFilterLoading
              ? // Show skeleton loading cards
                Array.from({ length: 12 }).map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} />
                ))
              : currentProducts.map((p) => (
                  <div key={p.id} className="h-full w-full">
                    <ProductCard
                      product={p}
                      loggedIn={!!user}
                      user={user}
                      selectedFilterArea={area}
                    />
                  </div>
                ))}
          </div>

          {/* Pagination Controls */}
          {filteredProducts.length > productsPerPage && !isFilterLoading && (
            <div className="flex flex-wrap items-center justify-center mt-6 gap-2">
              {/* Previous button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                {lang === "id" ? "Sebelumnya" : "Previous"}
              </Button>

              {/* Page number buttons with simplified logic */}
              <div className="flex items-center gap-1">
                {/* Show a simpler, fixed-width pagination with consistent display */}
                {(() => {
                  // Determine which pages to show based on total pages
                  const pages = [];
                  const maxVisible = 5; // Maximum number of page buttons to show

                  if (paginationTotalPages <= maxVisible) {
                    // If total pages is less than or equal to maxVisible, show all pages
                    for (let i = 1; i <= paginationTotalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Always show first page
                    pages.push(1);

                    // Determine middle pages based on current page
                    if (currentPage <= 3) {
                      // Near the start, show 2,3,4
                      for (let i = 2; i <= 4; i++) {
                        if (i <= paginationTotalPages - 1) pages.push(i);
                      }
                    } else if (currentPage >= paginationTotalPages - 2) {
                      // Near the end, show last-3, last-2, last-1
                      for (
                        let i = paginationTotalPages - 3;
                        i < paginationTotalPages;
                        i++
                      ) {
                        if (i > 1) pages.push(i);
                      }
                    } else {
                      // In the middle, show current-1, current, current+1
                      pages.push(currentPage - 1);
                      pages.push(currentPage);
                      if (currentPage + 1 < paginationTotalPages) {
                        pages.push(currentPage + 1);
                      }
                    }

                    // Always show last page if more than one page
                    if (
                      paginationTotalPages > 1 &&
                      !pages.includes(paginationTotalPages)
                    ) {
                      // Add ellipsis if there's a gap
                      if (!pages.includes(paginationTotalPages - 1)) {
                        pages.push(-1); // Use -1 to indicate ellipsis
                      }
                      pages.push(paginationTotalPages);
                    }
                  }

                  // Render the page buttons
                  return pages.map((page, index) => {
                    if (page === -1) {
                      // Render ellipsis
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-muted-foreground"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0" // Fixed width for consistent appearance
                        onClick={() => setCurrentPage(page)}
                        disabled={loading}
                      >
                        {page}
                      </Button>
                    );
                  });
                })()}
              </div>

              {/* Next button */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(paginationTotalPages, prev + 1)
                  )
                }
                disabled={currentPage === paginationTotalPages || loading}
              >
                {lang === "id" ? "Selanjutnya" : "Next"}
              </Button>

              {/* Items per page selector */}
              <select
                className={`rounded-md border bg-background px-3 py-1 text-xs ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                value={productsPerPage}
                onChange={(e) => {
                  if (loading) return;
                  setProductsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                disabled={loading}
              >
                <option value={8}>
                  {lang === "id" ? "8 per halaman" : "8 per page"}
                </option>
                <option value={12}>
                  {lang === "id" ? "12 per halaman" : "12 per page"}
                </option>
                <option value={16}>
                  {lang === "id" ? "16 per halaman" : "16 per page"}
                </option>
                <option value={24}>
                  {lang === "id" ? "24 per halaman" : "24 per page"}
                </option>
              </select>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
