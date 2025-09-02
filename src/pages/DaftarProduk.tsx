import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/hooks/use-cart";
import { formatIDR } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { useToast } from "@/components/ui/use-toast";
import { getAllProducts, getAllAreas, getAllBrands } from "@/services/product-service";

function ProductCard({ product, loggedIn, selectedFilterArea = '' }: { product: Product; loggedIn: boolean; selectedFilterArea?: string }) {
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
  const usedPrice = regional?.distributorPrice ?? product.distributorPrice;
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
  const subtotalDistributor = qty * usedPrice;
  const potentialRevenue = qty * product.consumerPrice;
  const profit = potentialRevenue - subtotalDistributor;
  const margin = potentialRevenue > 0 ? (profit / potentialRevenue) * 100 : 0;

  return (
    <article className="border rounded-lg p-4 flex flex-col gap-3 h-full">
      <div className="relative w-full overflow-hidden rounded-md">
        <img
          src={product.image || '/placeholder.svg'}
          alt={`${product.name} — ${product.size}`}
          loading="lazy"
          className="w-full h-40 object-cover"
        />
      </div>
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">{product.category} • {product.brand}</div>
          <h3 className="text-lg font-semibold">{product.name} — {product.size}</h3>
        </div>
        <Link to={`/produk/${product.id}`} className="text-sm text-primary underline-offset-4 hover:underline">Pelajari Lebih Lanjut</Link>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Harga Konsumen</div>
          <div className="text-base font-medium">{formatIDR(product.consumerPrice)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Harga Distributor</div>
          {loggedIn ? (
            <div className="text-base font-medium">{formatIDR(usedPrice)}</div>
          ) : (
            <div className="text-base font-medium blur-sm select-none">{formatIDR(usedPrice)}</div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">MOQ</div>
          <div className="text-base font-medium">{usedMoq} pcs</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Area Distribusi</div>
          <div className="text-base font-medium">{regional?.area ?? '-'}</div>
        </div>
      </div>

      {/* Use mt-auto to push this section to the bottom of the card */}
      <div className="mt-auto pt-2">
        {loggedIn ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
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
                  // Add to cart with exact quantity specified
                  addItem({
                    id: product.id,
                    name: product.name,
                    size: product.size,
                    image: product.image,
                    province: regional?.area || '',
                    unitPrice: usedPrice,
                    moq: usedMoq,
                    qty: qty, // Use exactly what the user specified
                    consumerPrice: product.consumerPrice,
                  });
                  
                  // Show toast notification
                  toast({
                    title: `${product.name} ${product.size}`,
                    description: `${qty} items added to cart`,
                    duration: 3000,
                  });
                }}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground">Masuk untuk menggunakan simulasi dan melihat harga distributor.</div>
            <div className="h-10">
              <Link to="/masuk" className="block">
                <Button variant="hero" size="sm" className="w-full h-full">Lihat Harga</Button>
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
  
  // State for products and areas
  const [products, setProducts] = useState<Product[]>([]);
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
  const ref = useRef<HTMLDivElement>(null);
  
  // Fetch products, areas and brands from Supabase when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch products
        const productsData = await getAllProducts();
        setProducts(productsData);
        
        // Fetch areas
        const areasData = await getAllAreas();
        setAreas(areasData);
        
        // Fetch brands
        const brandsData = await getAllBrands();
        setAllBrands(brandsData);
        
        // Set initial area if user has a location
        if (user?.kota && areasData.includes(user.kota)) {
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
    // In a real app, you would use a more comprehensive database
    const cityCoordinates: Record<string, [number, number]> = {
      'Jakarta Pusat': [-6.1751, 106.8650],
      'Jakarta Selatan': [-6.2615, 106.8106],
      'Jakarta Barat': [-6.1683, 106.7588],
      'Jakarta Timur': [-6.2256, 106.9012],
      'Jakarta Utara': [-6.1339, 106.8823],
      'Kota Bandung': [-6.9175, 107.6191],
      'Kota Surabaya': [-7.2575, 112.7521],
      'Kota Semarang': [-7.0051, 110.4381],
      'Kota Yogyakarta': [-7.7971, 110.3688],
      'Kota Medan': [3.5952, 98.6722],
      'Kota Makassar': [-5.1477, 119.4327],
      'Kota Tangerang': [-6.1701, 106.6403],
      'Kota Bekasi': [-6.2349, 107.0003],
      'Kota Depok': [-6.4025, 106.7942],
      'Kota Bogor': [-6.5944, 106.7892],
      'Kota Denpasar': [-8.6705, 115.2126],
      'Kota Malang': [-7.9797, 112.6304],
    };

    let nearest = '';
    let minDistance = Infinity;

    // Find the closest city by calculating distance
    Object.entries(cityCoordinates).forEach(([city, [lat, lng]]) => {
      if (areas.includes(city)) {
        // Simple distance calculation using Pythagorean theorem (not accurate for long distances)
        const distance = Math.sqrt(
          Math.pow(latitude - lat, 2) + Math.pow(longitude - lng, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = city;
        }
      }
    });

    return nearest;
  }, [areas]);

  // Auto-detect location using useCallback to avoid recreation on each render
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolokasi tidak didukung oleh browser Anda');
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
            ? 'Izin lokasi ditolak. Silakan izinkan akses lokasi untuk melihat produk di area Anda.'
            : 'Gagal mendeteksi lokasi Anda. Silakan pilih area secara manual.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [findNearestArea, setArea]);



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
  }, [area, selectedBrand, priceRange, products]);
  
  // Pagination logic
  const totalPages = useMemo(() => Math.ceil(filteredProducts.length / productsPerPage), [filteredProducts, productsPerPage]);
  
  // Current page products
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [currentPage, filteredProducts, productsPerPage]);
  const exportPDF = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const position = 10;

    if (imgHeight < pageHeight - 20) {
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    } else {
      // split into multiple pages
      let remainingHeight = imgHeight;
      let y = position;
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d')!;
      const ratio = imgWidth / canvas.width;
      const pageImgHeight = pageHeight / ratio;
      while (remainingHeight > 0) {
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageImgHeight, remainingHeight);
        pageCtx.drawImage(
          canvas,
          0,
          canvas.height - remainingHeight,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );
        const pageData = pageCanvas.toDataURL('image/png');
        if (y !== position) pdf.addPage();
        pdf.addImage(pageData, 'PNG', 10, position, imgWidth, pageCanvas.height * ratio);
        remainingHeight -= pageImgHeight;
        y = 0;
      }
    }
    
    // Create filename based on active filters
    let filename = 'daftar-produk';
    if (area) filename += '-' + area;
    if (selectedBrand) filename += '-' + selectedBrand;
    filename += '.pdf';
    
    pdf.save(filename);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Daftar Produk | Baskit Distributor Hub" description="Lihat katalog produk Baskit, harga konsumen, MOQ, dan harga distributor (setelah masuk)." />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-8 space-y-6">
        {/* Product List Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{t.productList}</h1>
        </div>
        
        {/* Filter Bar - Redesigned for cleaner UX */}
        <div className="bg-background border rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Area Distribution Filter - 3 columns */}
            <div className="md:col-span-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1.5">Area Distribusi</label>
                <div className="flex gap-2">
                  <select
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Semua Area</option>
                    {areas.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={detectUserLocation}
                    title="Deteksi Lokasi"
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
                  <option value="">Semua Brand</option>
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
                  <label className="text-sm font-medium">Rentang Harga</label>
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
                Reset
              </Button>
            </div>
            
            {/* Export Button - 1 column with optional separator on mobile */}
            <div className="md:col-span-12 md:border-t md:pt-3 md:mt-2 md:flex md:justify-end">
              <Button variant="outline" onClick={exportPDF} className="w-full md:w-auto">
                Export PDF
              </Button>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Harga distributor akan terlihat setelah Anda masuk / mendaftar.</p>
        <div ref={ref} className="space-y-4">
          <div className="border rounded-md p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">Ringkasan Ekspor</div>
              <div className="text-muted-foreground">
                Area: {area || 'Semua Area'} • 
                Brand: {selectedBrand || 'Semua Brand'} • 
                Harga: {formatIDR(priceRange[0])} - {formatIDR(priceRange[1])} • 
                Tanggal: {new Date().toLocaleDateString('id-ID')}
              </div>
            </div>
            <div className="text-muted-foreground">
              Total Produk: {filteredProducts.length} {currentPage > 1 && `(Halaman ${currentPage}/${totalPages})`}
              {items?.length ? ` • Item di Keranjang: ${items.length}` : ''}
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
                Previous
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Calculate which page numbers to show
                  let pageNum;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Only show if within valid range
                  if (pageNum > 0 && pageNum <= totalPages) {
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
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="text-muted-foreground">...</span>}
                    <Button 
                      variant={currentPage === totalPages ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              
              <select
                className="rounded-md border bg-background px-3 py-1 text-xs ml-2"
                value={productsPerPage}
                onChange={(e) => {
                  setProductsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={8}>8 per page</option>
                <option value={12}>12 per page</option>
                <option value={16}>16 per page</option>
                <option value={24}>24 per page</option>
              </select>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
