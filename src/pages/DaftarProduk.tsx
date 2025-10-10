import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Product, ProductVariant } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/hooks/use-cart";
import { formatIDR } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { addPDFHeader, addPDFFooter } from "@/utils/pdf-utils";
import { translations } from "@/lib/translations";
import { useToast } from "@/components/ui/use-toast";
import { getAllProducts, getAllAreas, getAllBrands, fetchProductsWithVariants, fetchProductsExpandedByVariants, ProductWithVariant } from "@/services/product-service";
import { generateCatalogPDF } from "@/utils/catalog";
import { supabase } from "@/integrations/supabase/client";

// Import the analytics helper
import { trackCatalogExport } from "@/utils/analytics";

// Cache duration constant
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

function ProductCard({ product, loggedIn, selectedFilterArea = '' }: { product: ProductWithVariant; loggedIn: boolean; selectedFilterArea?: string }) {
  // Debug UOM data in ProductCard
  if (product.name.includes('Gula Kapas')) {
    console.log(`ProductCard UOM debug for ${product.name}:`, {
      moq_uom: product.moq_uom,
      pricing_uom: product.pricing_uom,
      base_uom: product.base_uom,
      product: product
    });
  }
  
  const { addItem } = useCart();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  // If a filter area is selected and product has that area, use it as default
  const initialSelectedArea = (() => {
    if (selectedFilterArea && product.regions.some(r => r.area === selectedFilterArea)) {
      return selectedFilterArea;
    }
    return product.regions[0]?.area || '';
  })();
  
  const [selectedArea, setSelectedArea] = useState(initialSelectedArea);
  
  // Find the regional pricing based on selected area
  const regional = product.regions.find((r) => r.area === selectedArea) || product.regions[0];
  const basePrice = regional?.distributorPrice ?? product.distributorPrice;
  const usedMoq = regional?.moq ?? product.moq;
  const [qty, setQty] = useState(usedMoq);
  
  // Update area and quantity if filter area changes
  useEffect(() => {
    if (selectedFilterArea && product.regions.some(r => r.area === selectedFilterArea)) {
      setSelectedArea(selectedFilterArea);
      const newRegional = product.regions.find(r => r.area === selectedFilterArea) || product.regions[0];
      const newMoq = newRegional?.moq ?? product.moq;
      setQty(prev => Math.max(prev, newMoq));
    }
  }, [selectedFilterArea, product.regions, product.moq]);
  
  const subtotalDistributor = qty * basePrice;
  const potentialRevenue = qty * product.consumerPrice;
  const profit = potentialRevenue - subtotalDistributor;
  const margin = potentialRevenue > 0 ? (profit / potentialRevenue) * 100 : 0;

  return (
    <article className="border rounded-lg p-4 flex flex-col h-full bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="relative w-full overflow-hidden rounded-md mb-4">
        <img
          src={product.image || '/placeholder.svg'}
          alt={`${product.displayName} — ${product.size}`}
          loading="lazy"
          className="w-full h-40 object-cover"
        />
      </div>
      
      {/* Product Header */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>{product.category}</span>
              <span>•</span>
              <span>{product.brand}</span>
            </div>
            <h3 className="text-base font-semibold leading-tight text-foreground mb-1">
              {product.displayName}
            </h3>
            <div className="text-sm text-muted-foreground">{product.size}</div>
          </div>
          <div className="flex flex-col items-end gap-2 min-w-0">
            <Link 
              to={`/produk/${product.baseProductId}`} 
              className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
            >
              {lang === 'id' ? "Lihat Detail" : "View Details"}
            </Link>
            
            {/* Variant Info - Under Lihat Detail in same column */}
            {product.isVariant && product.variantInfo && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                Variant: {product.variantInfo.variantName}
              </span>
            )}
          </div>
        </div>
        
        {/* Variant Description - Full width if exists */}
        {product.isVariant && product.variantInfo?.variantDescription && (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              {product.variantInfo.variantDescription}
            </p>
          </div>
        )}
      </div>
      
      {/* Pricing Section */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {lang === 'id' ? "Harga Konsumen" : "Consumer Price"}
            </div>
            <div className="text-sm font-bold text-foreground flex flex-wrap items-baseline gap-1">
              <span>{formatIDR(product.consumerPrice)}</span>
              {product.pricing_uom && product.pricing_uom !== 'pcs' && (
                <span className="text-xs text-muted-foreground">/{product.pricing_uom}</span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {lang === 'id' ? "Harga Distributor" : "Distributor Price"}
            </div>
            {loggedIn ? (
              <div className="text-sm font-bold text-foreground flex flex-wrap items-baseline gap-1">
                <span>{formatIDR(basePrice)}</span>
                {(() => {
                  const priceUom = product.pricing_uom && product.pricing_uom !== 'pcs' ? product.pricing_uom : (regional?.price_uom || 'pcs');
                  return priceUom !== 'pcs' ? <span className="text-xs text-muted-foreground">/{priceUom}</span> : null;
                })()}
              </div>
            ) : (
              <div className="text-sm font-bold text-foreground blur-sm select-none flex flex-wrap items-baseline gap-1">
                <span>{formatIDR(basePrice)}</span>
                {(() => {
                  const priceUom = product.pricing_uom && product.pricing_uom !== 'pcs' ? product.pricing_uom : (regional?.price_uom || 'pcs');
                  return priceUom !== 'pcs' ? <span className="text-xs text-muted-foreground">/{priceUom}</span> : null;
                })()}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">MOQ</div>
            <div className="text-sm font-semibold text-foreground">
              {usedMoq} {product.moq_uom && product.moq_uom !== 'pcs' ? product.moq_uom : (regional?.moq_uom || 'pcs')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-muted-foreground mb-1">Area Distribusi</div>
            <div className="text-sm font-semibold text-foreground">{regional?.area ?? '-'}</div>
          </div>
        </div>
      </div>

      {/* Use mt-auto to push this section to the bottom of the card */}
      <div className="mt-auto pt-2">
        {loggedIn ? (
          <div className="space-y-3">
            <div className="grid gap-2 grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Area Distribusi</label>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    const newArea = e.target.value;
                    setSelectedArea(newArea);
                    
                    // Find the new MOQ for the selected area
                    const newRegional = product.regions.find(r => r.area === newArea) || product.regions[0];
                    const newMoq = newRegional?.moq ?? product.moq;
                    
                    // Update quantity to at least match the new MOQ
                    setQty((currentQty) => Math.max(currentQty, newMoq));
                  }}
                  className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                >
                  {product.regions.map((r) => (
                    <option key={r.area} value={r.area}>{r.area}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Kuantitas</label>
                <input
                  type="number"
                  min={usedMoq}
                  value={qty}
                  onChange={(e) => {
                    // Parse the new value as integer or use MOQ if invalid
                    const newValue = parseInt(e.target.value || '0');
                    
                    // Ensure the quantity is never below the MOQ for the selected area
                    setQty(newValue < usedMoq ? usedMoq : newValue);
                  }}
                  className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                />
              </div>
            </div>
            <div className="bg-muted/30 rounded-md p-2">
              <div className="text-xs text-muted-foreground mb-1">Estimasi Margin</div>
              <div className="text-sm font-medium">
                {profit > 0 ? (
                  <div className="space-y-0.5">
                    <div>{formatIDR(profit)}</div>
                    <div className="text-xs text-muted-foreground">{margin.toFixed(1)}% margin</div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">-</div>
                )}
              </div>
            </div>
            {/* Fixed height button container */}
            <div className="h-10">
              <Button
                variant="hero"
                size="sm"
                className="w-full h-full"
                onClick={() => {
                  // Add to cart with exact quantity specified and variant if selected
                  addItem({
                    id: product.baseProductId, // Use base product ID for cart consistency
                    name: product.name, // Use original product name
                    size: product.size,
                    image: product.image,
                    province: regional?.area || '',
                    unitPrice: basePrice,
                    moq: usedMoq,
                    qty: qty, // Use exactly what the user specified
                    consumerPrice: product.consumerPrice,
                    variant: product.isVariant && product.variantInfo ? {
                      id: product.variantInfo.id,
                      name: product.variantInfo.variantName,
                      additionalPrice: product.variantInfo.additionalPrice
                    } : undefined,
                  });
                  
                  // Show toast notification
                  toast({
                    title: `${product.displayName} ${product.size}`,
                    description: lang === 'id' 
                      ? `${qty} item ditambahkan ke keranjang` 
                      : `${qty} items added to cart`,
                    duration: 3000,
                  });
                }}
              >
                {lang === 'id' ? "Tambah ke Keranjang" : "Add to Cart"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground">
              {lang === 'id' 
                ? "Masuk untuk menggunakan simulasi dan melihat harga distributor."
                : "Login to use simulation and view distributor prices."
              }
            </div>
            <div className="h-10">
              <Link to="/masuk" className="block">
                <Button variant="hero" size="sm" className="w-full h-full">
                  {lang === 'id' ? "Lihat Harga" : "View Prices"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function DaftarProduk() {
  const { user } = useAuth();
  const { items } = useCart();
  const { lang } = useLanguage();
  const t = translations[lang];
  const { toast } = useToast();
  
  // State for products and areas - updated to use ProductWithVariant
  const [products, setProducts] = useState<ProductWithVariant[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [errorInfo, setErrorInfo] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [area, setArea] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [sortOrder, setSortOrder] = useState('price-asc');
  const [searchQuery, setSearchQuery] = useState('');
  
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
      if (cache.products && (now - cache.timestamp) < CACHE_DURATION) {
        console.log('Using cached product data');
        setProducts(cache.products);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Fetch products expanded by variants
        console.log('About to call fetchProductsExpandedByVariants...');
        const productsData = await fetchProductsExpandedByVariants();
        console.log('Fetched products data:', productsData);
        console.log('Number of products with variants expanded:', productsData.length);
        console.log('Variants found:', productsData.filter(p => p.isVariant).length);
        console.log('Sample variant product:', productsData.find(p => p.isVariant));
        
        // Update cache
        dataCacheRef.current = {
          products: productsData,
          timestamp: now
        };
        
        setProducts(productsData);
        
        // Set debug info for display
        const variantCount = productsData.filter(p => p.isVariant).length;
        setDebugInfo(`Total products: ${productsData.length}, Variants: ${variantCount}`);
        
        // Set fixed areas instead of fetching them
        const fixedAreas = ["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"];
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
          const prices = productsData.map(p => p.consumerPrice);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          // Initialize with full range (min to max)
          setPriceRange([minPrice, maxPrice]);
        }
      } catch (error) {
        console.error("Error loading product data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.kota]);

  // Calculate nearest area from user's coordinates with useCallback to avoid recreation
  const findNearestArea = useCallback((latitude: number, longitude: number) => {
    // This is a simplified mapping of Indonesian cities to approximate coordinates
    const cityMapping: Record<string, [number, number, string]> = {
      // Jakarta area (Jabodetabek)
      'Jakarta Pusat': [-6.1751, 106.8650, "Jabodetabek"],
      'Jakarta Selatan': [-6.2615, 106.8106, "Jabodetabek"],
      'Jakarta Barat': [-6.1683, 106.7588, "Jabodetabek"],
      'Jakarta Timur': [-6.2256, 106.9012, "Jabodetabek"],
      'Jakarta Utara': [-6.1339, 106.8823, "Jabodetabek"],
      'Kota Tangerang': [-6.1701, 106.6403, "Jabodetabek"],
      'Kota Bekasi': [-6.2349, 107.0003, "Jabodetabek"],
      'Kota Depok': [-6.4025, 106.7942, "Jabodetabek"],
      'Kota Bogor': [-6.5944, 106.7892, "Jabodetabek"],
      
      // Jawa Barat
      'Kota Bandung': [-6.9175, 107.6191, "Jawa Barat"],
      'Kota Cirebon': [-6.7320, 108.5523, "Jawa Barat"],
      
      // Jawa Tengah
      'Kota Semarang': [-7.0051, 110.4381, "Jawa Tengah"],
      'Kota Yogyakarta': [-7.7971, 110.3688, "Jawa Tengah"],
      
      // Jawa Timur
      'Kota Surabaya': [-7.2575, 112.7521, "Jawa Timur"],
      'Kota Malang': [-7.9797, 112.6304, "Jawa Timur"],
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
      setLocationError(lang === 'id' 
        ? 'Geolokasi tidak didukung oleh browser Anda' 
        : 'Geolocation is not supported by your browser');
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
            ? lang === 'id'
              ? 'Izin lokasi ditolak. Silakan izinkan akses lokasi untuk melihat produk di area Anda.'
              : 'Location permission denied. Please allow location access to see products in your area.'
            : lang === 'id'
              ? 'Gagal mendeteksi lokasi Anda. Silakan pilih area secara manual.'
              : 'Failed to detect your location. Please select an area manually.'
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
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          
          // Only prompt for location if the permission status is "prompt" (not yet decided)
          if (permissionStatus.state === 'prompt') {
            detectUserLocation();
          }
        } else {
          // Fallback for browsers without Permissions API
          detectUserLocation();
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
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
      filtered = filtered.filter(p => 
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.variantInfo?.variantName && p.variantInfo.variantName.toLowerCase().includes(query)) ||
        (p.displayName && p.displayName.toLowerCase().includes(query))
      );
    }
    
    // Filter by area
    if (area) {
      filtered = filtered.filter(p => p.regions.some(r => r.area === area));
    }
    
    // Filter by brand
    if (selectedBrand) {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }
    
    // Filter by price range
    filtered = filtered.filter(p => 
      p.consumerPrice >= priceRange[0] && p.consumerPrice <= priceRange[1]
    );
    
    return filtered;
  }, [searchQuery, area, selectedBrand, priceRange, products]);
  
  // Pagination logic
  const paginationTotalPages = useMemo(() => Math.ceil(filteredProducts.length / productsPerPage), [filteredProducts, productsPerPage]);
  
  // Current page products
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [currentPage, filteredProducts, productsPerPage]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(searchQuery.trim() || area || selectedBrand || 
             priceRange[0] > 0 || priceRange[1] < 1000000);
  }, [searchQuery, area, selectedBrand, priceRange]);

  // Export catalog function that respects filters
  const exportFilteredCatalog = async () => {
    try {
      let productsToExport: ProductWithVariant[];
      
      if (hasActiveFilters) {
        // Use filtered products if filters are active
        productsToExport = filteredProducts;
        console.log(`Exporting filtered catalog with ${filteredProducts.length} products`);
      } else {
        // Fetch ALL products from database if no filters are active
        console.log('No filters active, fetching all products from database...');
        const allProducts = await fetchProductsExpandedByVariants();
        productsToExport = allProducts;
        console.log(`Exporting complete catalog with ${allProducts.length} products`);
      }

      // Generate the catalog with the appropriate product set
      const fileName = hasActiveFilters 
        ? `baskit-catalog-filtered-${new Date().toISOString().slice(0, 10)}`
        : `baskit-catalog-complete-${new Date().toISOString().slice(0, 10)}`;
        
      await generateCatalogPDF({ 
        products: productsToExport, 
        distributionArea: area || 'Semua Area',
        fileName: fileName
      });

      // Show success toast
      toast({
        title: lang === 'id' ? 'Katalog Berhasil Diunduh' : 'Catalog Successfully Downloaded',
        description: lang === 'id' 
          ? `Katalog ${hasActiveFilters ? 'terfilter' : 'lengkap'} dengan ${productsToExport.length} produk berhasil diunduh`
          : `${hasActiveFilters ? 'Filtered' : 'Complete'} catalog with ${productsToExport.length} products successfully downloaded`,
      });
    } catch (error) {
      console.error('Error exporting catalog:', error);
      toast({
        title: lang === 'id' ? 'Gagal mengunduh katalog' : 'Failed to download catalog',
        description: lang === 'id' ? 'Terjadi kesalahan saat mengunduh katalog' : 'An error occurred while downloading the catalog',
        variant: "destructive",
      });
    }
  };

  // Baskit brand colors
  const COLORS = {
    tealGreen: [0, 104, 90], // #00685A - Primary color
    orange: [242, 101, 34],  // #F26522 - Secondary color
    lime: [140, 198, 63],    // #8CC63F - Accent color
    yellow: [253, 187, 48],  // #FDBB30 - Accent color
    lightGray: [245, 245, 245], // #F5F5F5 - Background
    gray: [100, 100, 100],   // #646464 - Text
    darkGray: [51, 51, 51],  // #333333 - Dark text
    purple: [128, 90, 213]   // #805AD5 - Variant color
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
    const regional = product.regions.find(r => r.area === selectedArea) || product.regions[0];
    const usedPrice = regional?.distributorPrice ?? product.distributorPrice;
    const usedMoq = regional?.moq ?? product.moq;
    const margin = product.consumerPrice > 0 ? ((product.consumerPrice - usedPrice) / product.consumerPrice) * 100 : 0;
    
    // Calculate actual card height based on product
    const actualHeight = getItemHeight(product, height);
    
    // Create a clean product card with better shadow effect
    // Draw shadow
    pdf.setFillColor(230, 230, 230);
    pdf.roundedRect(x + 1.5, y + 1.5, width, actualHeight, 4, 4, 'F');
    
    // Draw white box with proper border
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, width, actualHeight, 4, 4, 'FD');
    
    // Draw the product image area with improved styling
    pdf.setFillColor(250, 250, 250); // Very light gray background for product
    pdf.roundedRect(x + 7, y + 7, width - 14, width - 14, 3, 3, 'F');
    
    // Draw product brand logo area
    if (product.brand) {
      // Brand logo background
      pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2], 0.05);
      pdf.roundedRect(x + 7, y + 7, width - 14, 20, 3, 3, 'F');
      
      // Brand name
      pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(product.brand.toUpperCase(), x + 12, y + 19);
    }
    
    // Draw product image placeholder with improved styling
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    if (product.displayName) {
      const nameLines = pdf.splitTextToSize(product.displayName.toUpperCase(), width - 24);
      pdf.text(nameLines, x + width/2, y + (width/2) - 5, { align: 'center' });
    }
    
    // Starting Y position for product details (below the image)
    const detailsY = y + width;
    
    // Add category badge with improved styling
    if (product.category) {
      pdf.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2], 0.1);
      pdf.setDrawColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.setFontSize(7);
      
      const categoryText = product.category;
      const categoryWidth = pdf.getStringUnitWidth(categoryText) * 7 / pdf.internal.scaleFactor;
      
      // Draw badge background with better padding
      pdf.roundedRect(x + 7, detailsY + 3, categoryWidth + 10, 10, 3, 3, 'FD');
      // Draw category text
      pdf.text(categoryText, x + 12, detailsY + 10);
    }
    
    // Product name with improved styling - use displayName for variants
    pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    // Split name if too long
    const nameLines = pdf.splitTextToSize(product.displayName, width - 14);
    pdf.text(nameLines, x + 7, detailsY + 20);
    
    // Product size/ID with better positioning - show variant info if it's a variant
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    let sizeText = `${product.size} • SKU: ${product.baseProductId}`;
    if (product.isVariant && product.variantInfo) {
      sizeText += ` • Variant: ${product.variantInfo.variantName}`;
    }
    pdf.text(sizeText, x + 7, detailsY + 20 + (nameLines.length * 5) + 3);
    
    // If product is a variant, add a variant badge
    if (product.isVariant) {
      const variantText = "Variant Product";
      const textWidth = pdf.getStringUnitWidth(variantText) * 7.5 / pdf.internal.scaleFactor;
      
      // Draw variant badge
      pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2], 0.1);
      pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
      pdf.roundedRect(x + width - textWidth - 12, detailsY + 20 + (nameLines.length * 5), textWidth + 8, 10, 2, 2, 'FD');
      
      // Add variant text
      pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
      pdf.setFontSize(7);
      pdf.text(variantText, x + width - textWidth - 8, detailsY + 20 + (nameLines.length * 5) + 7);
    }
    
    // Divider line with proper styling
    pdf.setDrawColor(240, 240, 240);
    pdf.setLineWidth(0.7);
    pdf.line(x + 7, detailsY + 35, x + width - 7, detailsY + 35);
    
    // First row of details - with better vertical spacing
    const row1Y = detailsY + 45;
    
    // Left column - Distributor Price with improved styling
    pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2], 0.08);
    pdf.roundedRect(x + 7, row1Y - 5, (width/2) - 10, 25, 3, 3, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    pdf.setFont('helvetica', 'normal');
    const distributorPriceUom = product.pricing_uom && product.pricing_uom !== 'pcs' ? product.pricing_uom : (regional?.price_uom || 'pcs');
    const distributorLabel = distributorPriceUom !== 'pcs' ? `Harga Distributor (per ${distributorPriceUom})` : 'Harga Distributor';
    pdf.text(distributorLabel, x + 12, row1Y);
    
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatIDR(usedPrice), x + 12, row1Y + 10);
    
    // Right column - Consumer Price with improved styling
    pdf.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2], 0.08);
    pdf.roundedRect(x + (width/2) + 3, row1Y - 5, (width/2) - 10, 25, 3, 3, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    pdf.setFont('helvetica', 'normal');
    const consumerPriceUom = product.pricing_uom || 'pcs';
    const consumerLabel = consumerPriceUom !== 'pcs' ? `Harga Konsumen (per ${consumerPriceUom})` : 'Harga Konsumen';
    pdf.text(consumerLabel, x + (width/2) + 8, row1Y);
    
    pdf.setFontSize(10);
    pdf.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatIDR(product.consumerPrice), x + (width/2) + 8, row1Y + 10);
    
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
    pdf.roundedRect(x + 7, row2Y - 5, columnWidth, 20, 3, 3, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    pdf.text('Margin Distributor', x + 12, row2Y);
    
    pdf.setFontSize(9.5);
    pdf.setTextColor(marginColor[0], marginColor[1], marginColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${margin.toFixed(1)}%`, x + 12, row2Y + 10);
    
    // Right column - MOQ with improved styling
    pdf.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    pdf.roundedRect(x + 7 + columnWidth + 3, row2Y - 5, columnWidth, 20, 3, 3, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    pdf.text('Min. Qty Pesanan', x + 12 + columnWidth + 3, row2Y);
    
    pdf.setFontSize(9.5);
    pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    pdf.setFont('helvetica', 'bold');
    const moqUom = product.moq_uom && product.moq_uom !== 'pcs' ? product.moq_uom : (regional?.moq_uom || 'pcs');
    pdf.text(`${usedMoq} ${moqUom}`, x + 12 + columnWidth + 3, row2Y + 10);
    
    // Third row - Area with improved styling
    const row3Y = row2Y + 25;
    
    pdf.setFontSize(7);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Area Distribusi', x + 7, row3Y);
    
    pdf.setFontSize(8);
    pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(regional?.area || 'Semua Area', x + 7, row3Y + 8);
    
    // Add variant information if product is a variant
    if (product.isVariant && product.variantInfo) {
      const row4Y = row3Y + 18;
      
      // Create a variant section header
      pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2], 0.08);
      pdf.roundedRect(x + 7, row4Y - 3, width - 14, 15, 2, 2, 'F');
      
      pdf.setFontSize(7);
      pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Variant Details:', x + 10, row4Y + 4);
      
      // Variant name and price
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
      pdf.setFont('helvetica', 'normal');
      
      const variantText = `• ${product.variantInfo.variantName}`;
      const priceText = product.variantInfo.additionalPrice > 0 
        ? `+${formatIDR(product.variantInfo.additionalPrice)}` 
        : 'No extra charge';
      
      pdf.text(variantText, x + 10, row4Y + 11);
      
      // Add price info for the variant
      pdf.setTextColor(product.variantInfo.additionalPrice > 0 ? COLORS.orange[0] : COLORS.tealGreen[0], 
                     product.variantInfo.additionalPrice > 0 ? COLORS.orange[1] : COLORS.tealGreen[1], 
                     product.variantInfo.additionalPrice > 0 ? COLORS.orange[2] : COLORS.tealGreen[2]);
      pdf.text(priceText, x + width - 40, row4Y + 11);
    }
  };
  
  const exportPDF = async () => {
    try {
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Track catalog export for analytics
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user for analytics:', userError);
        } else if (userData?.user) {
          // Use the helper function to track the export
          await trackCatalogExport(
            userData.user.id,
            filteredProducts.length,
            area || 'all',
            selectedBrand || null,
            priceRange
          );
        }
      } catch (error) {
        console.error('Error in catalog export analytics:', error);
      }
      
      // Group products by category
      const groupedProducts: Record<string, ProductWithVariant[]> = {};
      
      filteredProducts.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!groupedProducts[category]) {
          groupedProducts[category] = [];
        }
        groupedProducts[category].push(product);
      });
      
      // Create an elegant cover page
      // Create a clean white background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Add teal green header area at top
      pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Add teal green footer area at bottom
      pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
      pdf.rect(0, pageHeight - 40, pageWidth, 40, 'F');
      
      // Add modern side accent bar
      pdf.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.rect(0, 40, 15, pageHeight - 80, 'F');
      
      // Add decorative elements - subtle pattern overlay
      for (let i = 0; i < 12; i++) {
        const opacity = 0.04;
        const size = 30;
        const xPos = (i % 4) * 60;
        const yPos = Math.floor(i / 4) * 60 + 50;
        
        pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2], opacity);
        pdf.circle(pageWidth - xPos - 20, yPos, size, 'F');
      }
      
      // Add diagonal accent line
      pdf.setDrawColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2], 0.3);
      pdf.setLineWidth(30);
      pdf.line(pageWidth, 0, 0, pageHeight);
      
      // Add main title block in the center with clean white background
      const titleBoxWidth = 160;
      const titleBoxHeight = 200;
      const titleBoxX = (pageWidth - titleBoxWidth) / 2;
      const titleBoxY = (pageHeight - titleBoxHeight) / 2 - 10;
      
      // Create white background for title box
      pdf.setFillColor(255, 255, 255, 0.9);
      pdf.roundedRect(titleBoxX, titleBoxY, titleBoxWidth, titleBoxHeight, 6, 6, 'F');
      
      // Add subtle border
      pdf.setDrawColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2], 0.3);
      pdf.setLineWidth(1);
      pdf.roundedRect(titleBoxX + 3, titleBoxY + 3, titleBoxWidth - 6, titleBoxHeight - 6, 4, 4, 'S');
      
      // Add baskit logo and title in the center box
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(42);
      pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
      pdf.text('baskit', pageWidth/2, titleBoxY + 50, { align: 'center' });
      
      // Draw colored squares for the logo - larger for cover
      const logoSquareSize = 14;
      const logoSquareGap = 2;
      const logoX = pageWidth/2 - (logoSquareSize * 2 + logoSquareGap) / 2;
      const logoY = titleBoxY + 60;
      
      // Draw logo squares with slight rounding
      const drawCoverSquare = (x: number, y: number, color: number[]) => {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(x, y, logoSquareSize, logoSquareSize, 2, 2, 'F');
      };
      
      drawCoverSquare(logoX, logoY, COLORS.tealGreen);
      drawCoverSquare(logoX + logoSquareSize + logoSquareGap, logoY, COLORS.orange);
      drawCoverSquare(logoX + logoSquareSize + logoSquareGap, logoY + logoSquareSize + logoSquareGap, COLORS.lime);
      drawCoverSquare(logoX, logoY + logoSquareSize + logoSquareGap, COLORS.yellow);
      
      // Add title text with premium styling
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
      pdf.text('PRODUCT', pageWidth/2, titleBoxY + 115, { align: 'center' });
      
      pdf.setFontSize(38);
      pdf.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
      pdf.text('CATALOG', pageWidth/2, titleBoxY + 145, { align: 'center' });
      
      // Add area information with better styling
      const areaText = area || 'Semua Area';
      pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2], 0.1);
      pdf.roundedRect(titleBoxX + 20, titleBoxY + 160, titleBoxWidth - 40, 25, 3, 3, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
      pdf.text(areaText, pageWidth/2, titleBoxY + 178, { align: 'center' });
      
      // Add date with premium styling
      const formattedFullDate = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Add date box at bottom of title box
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(COLORS.darkGray[0], COLORS.darkGray[1], COLORS.darkGray[2]);
      pdf.text(formattedFullDate, pageWidth/2, pageHeight/2 + 110, { align: 'center' });
      
      // Add product count information
      const productCountText = `${filteredProducts.length} ${lang === 'id' ? 'Produk' : 'Products'}`;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.text(productCountText, pageWidth/2, pageHeight/2 + 130, { align: 'center' });
      
      // Add contact info in the footer area
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('www.baskit-distributor.com', 25, pageHeight - 20);
      pdf.text('info@baskit-distributor.com | +62 822 1234 5678', pageWidth - 25, pageHeight - 20, { align: 'right' });
      
      // Add first content page
      pdf.addPage();
      let yPosition = addPDFHeader(pdf, { 
        title: 'Product Catalog',
        subtitle: `${filteredProducts.length} Products`,
        area: area || 'All Areas',
        customColors: {
          titleColor: [COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]],
          areaColor: [COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]]
        },
        extraPadding: 5
      });
      
      // For each category, add a section header and products
      let productCount = 0;
      for (const [category, products] of Object.entries(groupedProducts)) {
        // Skip to a new page if we're close to the bottom and it's not the first category
        if (yPosition > pageHeight - 50 && productCount > 0) {
          pdf.addPage();
          yPosition = addPDFHeader(pdf, { 
            title: 'Product Catalog',
            subtitle: `${filteredProducts.length} Products`,
            area: area || 'All Areas'
          });
          yPosition += 10; // Add some padding after header
        }
        
        // Draw category header with improved styling
        const drawCategoryHeader = (pdf: jsPDF, category: string, y: number) => {
          const headerHeight = 20;
          
          // Create an elegant gradient-style background
          pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2], 0.08);
          pdf.roundedRect(10, y, pageWidth - 20, headerHeight, 3, 3, 'F');
          
          // Add left accent bar for visual interest
          pdf.setFillColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
          pdf.rect(10, y, 4, headerHeight, 'F');
          
          // Add subtle right decoration
          pdf.setFillColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2], 0.15);
          pdf.circle(pageWidth - 15, y + headerHeight/2, 8, 'F');
          
          // Add category text with better styling
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
          pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
          pdf.text(category, 25, y + 14);
          
          // Add product count if available
          const productCount = groupedProducts[category]?.length || 0;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
          pdf.text(`${productCount} ${productCount === 1 ? 'product' : 'products'}`, pageWidth - 40, y + 14);
          
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
        const availableWidth = pageWidth - 20 - ((itemsPerRow - 1) * marginBetweenItems);
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
          xPosition = 10 + (col * (itemWidth + marginBetweenItems));
          
          // Check if we need a new row
          if (col === 0 && i > 0) {
            yPosition += itemHeight + 10;
          }
          
          // Check if we need a new page - with better spacing management
          if (yPosition + itemHeight > pageHeight - 30) {
            pdf.addPage();
            yPosition = addPDFHeader(pdf, { 
              title: 'Product Catalog',
              subtitle: `${filteredProducts.length} Products`,
              area: area || 'All Areas',
              customColors: {
                titleColor: [COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]],
                areaColor: [COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]]
              },
              extraPadding: 5
            });
            yPosition += 10;
          }
          
          // Draw product card
          drawProductCard(pdf, product, xPosition, yPosition, itemWidth, baseItemHeight, area);
          
          productCount++;
        }
        
        // Move position to after this category's products
        if (products.length > 0) {
          const rowsForCategory = Math.ceil(products.length / itemsPerRow);
          yPosition = startingYPosition + (rowsForCategory * (itemHeight + 10)) + 20;
        }
      }
      
      // Add page numbers at the bottom
      const totalPdfPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPdfPages; i++) {
        pdf.setPage(i);
        addPDFFooter(pdf, i, totalPdfPages, {
          disclaimer: 'Harga dan stok dapat berubah sewaktu-waktu',
          website: 'www.baskit-distributor.com',
          showLogo: true,
          customColors: {
            footerColor: [COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]]
          }
        });
      }
      
      // Create filename based on active filters
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      let filename = `baskit-catalog-${timestamp}`;
      if (area) filename += '-' + area.toLowerCase().replace(/\s+/g, '-');
      if (selectedBrand) filename += '-' + selectedBrand.toLowerCase().replace(/\s+/g, '-');
      filename += '.pdf';
      
      pdf.save(filename);
      
      // Show success notification
      toast({
        title: lang === 'id' ? 'Katalog Berhasil Diunduh' : 'Catalog Successfully Downloaded',
        description: lang === 'id' 
          ? `Katalog produk ${area ? area + ' ' : ''}berhasil diunduh dengan ${filteredProducts.length} produk` 
          : `${area ? area + ' ' : ''}Product catalog successfully downloaded with ${filteredProducts.length} products`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: lang === 'id' ? 'Gagal mengunduh katalog' : 'Failed to download catalog',
        description: lang === 'id' ? 'Terjadi kesalahan saat mengunduh katalog' : 'An error occurred while downloading the catalog',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Daftar Produk | Baskit Distributor Hub" : "Product List | Baskit Distributor Hub"} 
        description={
          lang === 'id' 
            ? "Lihat katalog produk Baskit, harga konsumen, MOQ, dan harga distributor (setelah masuk)." 
            : "View Baskit product catalog, consumer prices, MOQ, and distributor prices (after login)."
        } 
      />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-8 space-y-6">
        {/* Product List Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t.productList}</h1>
        </div>
        
        {/* Filter Bar - Redesigned for cleaner UX */}
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Area Distribution Filter - 4 columns */}
            <div className="md:col-span-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1.5">
                  {lang === 'id' ? "Area Distribusi" : "Distribution Area"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      {lang === 'id' ? "Semua Area" : "All Areas"}
                    </option>
                    {["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={detectUserLocation}
                    title={lang === 'id' ? "Deteksi Lokasi" : "Detect Location"}
                    disabled={isLocating}
                  >
                    {isLocating ? 
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : 
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                    }
                  </Button>
                </div>
                {locationError && <p className="text-xs text-destructive mt-1">{locationError}</p>}
              </div>
            </div>
            
            {/* Brand Filter - 3 columns */}
            <div className="md:col-span-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1.5">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">
                    {lang === 'id' ? "Semua Brand" : "All Brands"}
                  </option>
                  {allBrands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Price Range Filter - 5 columns */}
            <div className="md:col-span-5">
              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium">
                    {lang === 'id' ? "Rentang Harga per Karton" : "Price Range per Carton"}
                  </label>
                  <div className="text-xs text-muted-foreground">
                    {formatIDR(priceRange[0])} - {formatIDR(priceRange[1])}
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      min={priceBounds[0]}
                      max={priceRange[1]}
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newMin = Math.max(priceBounds[0], value);
                        if (newMin <= priceRange[1]) {
                          setPriceRange([newMin, priceRange[1]]);
                          setCurrentPage(1);
                        }
                      }}
                      placeholder="Min"
                    />
                  </div>
                  <span className="text-sm">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      min={priceRange[0]}
                      max={priceBounds[1]}
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const newMax = Math.min(priceBounds[1], value);
                        if (newMax >= priceRange[0]) {
                          setPriceRange([priceRange[0], newMax]);
                          setCurrentPage(1);
                        }
                      }}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Buttons - 1 column */}
            <div className="md:col-span-1 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => {
                  setArea("");
                  setSelectedBrand("");
                  setPriceRange([priceBounds[0], priceBounds[1]]);
                  setCurrentPage(1);
                }}
              >
                {lang === 'id' ? "Reset" : "Reset"}
              </Button>
            </div>
            
            {/* Export Button - 1 column with optional separator on mobile */}
            <div className="md:col-span-12 md:border-t md:pt-3 md:mt-2 md:flex md:justify-end">
              <div className="flex flex-col md:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={exportFilteredCatalog}
                  className="w-full md:w-auto flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {lang === 'id' ? "Unduh Katalog" : "Download Catalog"}
                </Button>
                
                <div className="text-xs text-muted-foreground text-right flex items-center md:ml-2">
                {/* Empty div to maintain layout */}
              </div>
              </div>
            </div>
          </div>
        </div>
        {!user && (
          <p className="text-muted-foreground text-sm">
            {lang === 'id'
              ? "Harga distributor akan terlihat setelah Anda masuk / mendaftar."
              : "Distributor prices will be visible after you login / register."
            }
          </p>
        )}
        <div ref={ref} className="space-y-4">
          <div className="border rounded-md p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">
                {lang === 'id' ? "Filter & Tampilan" : "Filter & Display"}
              </div>
              <div className="text-muted-foreground">
                {searchQuery && (
                  <>
                    {lang === 'id' ? "Pencarian: " : "Search: "}"{searchQuery}" • 
                  </>
                )}
                {lang === 'id' ? "Area: " : "Area: "}{area || (lang === 'id' ? 'Semua Area' : 'All Areas')} • 
                Brand: {selectedBrand || (lang === 'id' ? 'Semua Brand' : 'All Brands')} • 
                {lang === 'id' ? " Rentang Harga: " : " Price Range: "}{formatIDR(priceRange[0])} - {formatIDR(priceRange[1])}
              </div>
            </div>
            <div className="text-right text-muted-foreground">
              <div className="text-sm font-medium text-foreground">
                {lang === 'id' ? "Menampilkan: " : "Showing: "}{filteredProducts.length} {lang === 'id' ? 'produk' : 'products'}
              </div>
              {currentPage > 1 && (
                <div className="text-xs">
                  {lang === 'id' 
                    ? `Halaman ${currentPage} dari ${paginationTotalPages}` 
                    : `Page ${currentPage} of ${paginationTotalPages}`
                  }
                </div>
              )}
              {items?.length > 0 && (
                <div className="text-xs">
                  {lang === 'id' 
                    ? `${items.length} item di keranjang` 
                    : `${items.length} items in cart`
                  }
                </div>
              )}
            </div>
          </div>
          
          {/* Search Bar - Positioned above product cards */}
          <div className="bg-background border rounded-lg p-4 shadow-sm">
            <div className="max-w-md">
              <label className="text-sm font-medium mb-2 block">
                {lang === 'id' ? "Cari SKU/Produk" : "Search SKU/Product"}
              </label>
              <Input
                type="text"
                placeholder={lang === 'id' ? "Masukkan SKU atau nama produk..." : "Enter SKU or product name..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentProducts.map((p) => (
              <div key={p.id} className="h-full flex">
                <ProductCard 
                  product={p} 
                  loggedIn={!!user} 
                  selectedFilterArea={area} 
                />
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {filteredProducts.length > productsPerPage && (
            <div className="flex items-center justify-center mt-6 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {lang === 'id' ? "Sebelumnya" : "Previous"}
              </Button>
              
              <div className="flex items-center space-x-1">
                {/* Show first page */}
                {currentPage > 3 && (
                  <>
                    <Button 
                      variant={currentPage === 1 ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </Button>
                    {currentPage > 4 && <span className="text-muted-foreground">...</span>}
                  </>
                )}
                
                {/* Show nearby pages */}
                {Array.from({ length: Math.min(5, paginationTotalPages) }, (_, i) => {
                  // Calculate which page numbers to show
                  let pageNum;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= paginationTotalPages - 2) {
                    pageNum = paginationTotalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Only show if within valid range
                  if (pageNum > 0 && pageNum <= paginationTotalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                {/* Show last page */}
                {currentPage < paginationTotalPages - 2 && (
                  <>
                    {currentPage < paginationTotalPages - 3 && <span className="text-muted-foreground">...</span>}
                    <Button 
                      variant={currentPage === paginationTotalPages ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setCurrentPage(paginationTotalPages)}
                    >
                      {paginationTotalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(paginationTotalPages, prev + 1))}
                disabled={currentPage === paginationTotalPages}
              >
                {lang === 'id' ? "Selanjutnya" : "Next"}
              </Button>
              
              <select
                className="rounded-md border bg-background px-3 py-1 text-xs ml-2"
                value={productsPerPage}
                onChange={(e) => {
                  setProductsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={8}>
                  {lang === 'id' ? "8 per halaman" : "8 per page"}
                </option>
                <option value={12}>
                  {lang === 'id' ? "12 per halaman" : "12 per page"}
                </option>
                <option value={16}>
                  {lang === 'id' ? "16 per halaman" : "16 per page"}
                </option>
                <option value={24}>
                  {lang === 'id' ? "24 per halaman" : "24 per page"}
                </option>
              </select>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
