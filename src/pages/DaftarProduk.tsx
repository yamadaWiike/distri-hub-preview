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
        <Link to={`/produk/${product.id}`} className="text-sm text-primary underline-offset-4 hover:underline">
          {lang === 'id' ? "Pelajari Lebih Lanjut" : "Learn More"}
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {lang === 'id' ? "Harga Konsumen" : "Consumer Price"}
          </div>
          <div className="text-base font-medium">{formatIDR(product.consumerPrice)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {lang === 'id' ? "Harga Distributor" : "Distributor Price"}
          </div>
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
  const [isExporting, setIsExporting] = useState(false);
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
  const paginationTotalPages = useMemo(() => Math.ceil(filteredProducts.length / productsPerPage), [filteredProducts, productsPerPage]);
  
  // Current page products
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [currentPage, filteredProducts, productsPerPage]);
  const exportPDF = async () => {
    try {
      setIsExporting(true);
      // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // We'll use direct path for logo
    
    // Utility function to add a page with header
    const addPageWithHeader = () => {
      // Add white header background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Draw Baskit logo directly
      // Draw "baskit" text
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 51, 51); // Dark gray
      pdf.setFontSize(18);
      pdf.text('baskit', 10, 18);
      
      // Draw colored squares for the logo
      const squareSize = 5;
      const logoX = 58;
      const logoY = 13;
      
      pdf.setFillColor(0, 102, 87); // Teal green - top left
      pdf.rect(logoX, logoY, squareSize, squareSize, 'F');
      
      pdf.setFillColor(242, 101, 34); // Orange - top right
      pdf.rect(logoX + squareSize + 1, logoY, squareSize, squareSize, 'F');
      
      pdf.setFillColor(140, 198, 63); // Green - bottom right
      pdf.rect(logoX + squareSize + 1, logoY + squareSize + 1, squareSize, squareSize, 'F');
      
      pdf.setFillColor(253, 187, 48); // Yellow - bottom left
      pdf.rect(logoX, logoY + squareSize + 1, squareSize, squareSize, 'F');
      
      // Add title
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(242, 101, 34); // Baskit orange color
      pdf.setFontSize(24);
      pdf.text('Distributor Catalog', 70, 18);
      
      // Add Area Distribusi on the right side
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 102, 87); // Teal green
      pdf.setFontSize(10);
      pdf.text('Area Distribusi', pageWidth - 60, 15);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0); 
      pdf.text(area || 'Semua Area', pageWidth - 60, 20);
      
      // Add date
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 102, 87); // Teal green
      pdf.text('Tanggal Catalog', pageWidth - 30, 15);
      
      // Format date as DD/MM/YY
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = String(currentDate.getFullYear()).substring(2);
      const formattedDate = `${day}/${month}/${year}`;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(formattedDate, pageWidth - 30, 20);
      
      // Add horizontal line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(10, 25, pageWidth - 10, 25);
      
      return 30; // Return starting Y position for content
    };
    
    // Add cover page
    // Create background gradient-like effect
    pdf.setFillColor(0, 102, 87); // Teal green
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add decorative element
    pdf.setFillColor(242, 101, 34, 0.2); // Light orange
    pdf.circle(pageWidth - 50, 50, 80, 'F');
    pdf.circle(50, pageHeight - 80, 60, 'F');
    
    // Add baskit logo
    pdf.setFillColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.setTextColor(255, 255, 255);
    pdf.text('baskit', pageWidth/2, pageHeight/2 - 50, { align: 'center' });
    
    // Draw colored squares for the logo - larger for cover
    const logoSquareSize = 12;
    const logoX = pageWidth/2 + 40;
    const logoY = pageHeight/2 - 55;
    
    pdf.setFillColor(0, 102, 87); // Teal green - top left
    pdf.rect(logoX, logoY, logoSquareSize, logoSquareSize, 'F');
    
    pdf.setFillColor(242, 101, 34); // Orange - top right
    pdf.rect(logoX + logoSquareSize + 2, logoY, logoSquareSize, logoSquareSize, 'F');
    
    pdf.setFillColor(140, 198, 63); // Green - bottom right
    pdf.rect(logoX + logoSquareSize + 2, logoY + logoSquareSize + 2, logoSquareSize, logoSquareSize, 'F');
    
    pdf.setFillColor(253, 187, 48); // Yellow - bottom left
    pdf.rect(logoX, logoY + logoSquareSize + 2, logoSquareSize, logoSquareSize, 'F');
    
    // Add title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(48);
    pdf.setTextColor(255, 255, 255);
    pdf.text('DISTRIBUTOR', pageWidth/2, pageHeight/2 + 10, { align: 'center' });
    pdf.text('CATALOG', pageWidth/2, pageHeight/2 + 45, { align: 'center' });
    
    // Add catalog details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.text(area || 'Semua Area', pageWidth/2, pageHeight/2 + 80, { align: 'center' });
    
    // Add date
    const formattedFullDate = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    pdf.text(formattedFullDate, pageWidth/2, pageHeight/2 + 100, { align: 'center' });
    
    // Add contact info at bottom
    pdf.setFontSize(10);
    pdf.text('www.baskit-distributor.com', pageWidth/2, pageHeight - 50, { align: 'center' });
    pdf.text('info@baskit-distributor.com | +62 822 1234 5678', pageWidth/2, pageHeight - 35, { align: 'center' });
    
    // Add page break
    pdf.addPage();
    
    // Add table of contents page
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add header
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 102, 87); // Teal green
    pdf.setFontSize(24);
    pdf.text('Daftar Isi', 20, 30);
    
    pdf.setDrawColor(0, 102, 87); // Teal green
    pdf.line(20, 35, 80, 35);
    
    let tocY = 50;
    
    // Add introduction section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('1. Informasi Katalog', 20, tocY);
    tocY += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Informasi area distribusi', 25, tocY);
    pdf.text('3', 180, tocY, { align: 'right' });
    tocY += 8;
    
    pdf.text('Panduan pemesanan produk', 25, tocY);
    pdf.text('3', 180, tocY, { align: 'right' });
    tocY += 8;
    
    pdf.text('Syarat dan ketentuan', 25, tocY);
    pdf.text('3', 180, tocY, { align: 'right' });
    tocY += 20;
    
    // Add product categories
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('2. Daftar Produk', 20, tocY);
    tocY += 10;
    
    // Group products by category for ToC
    const categories = [...new Set(filteredProducts.map(p => p.category || 'Lainnya'))];
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    categories.forEach((category, index) => {
      pdf.text(`${category}`, 25, tocY);
      pdf.text('4', 180, tocY, { align: 'right' });
      tocY += 8;
    });
    
    tocY += 20;
    
    // Add contact information
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('3. Kontak dan Pemesanan', 20, tocY);
    tocY += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
      pdf.text('Informasi kontak', 25, tocY);
    pdf.text(String(paginationTotalPages), 180, tocY, { align: 'right' });
    tocY += 8;
    
    pdf.text('Cara pemesanan', 25, tocY);
    pdf.text(String(paginationTotalPages), 180, tocY, { align: 'right' });    // Add page break for intro page
    pdf.addPage();
    
    // Add intro page
    const introY = addPageWithHeader();
    
    // Add intro header
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 102, 87); // Teal green
    pdf.setFontSize(18);
    pdf.text('Informasi Katalog', 20, introY + 10);
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, introY + 15, pageWidth - 20, introY + 15);
    
    // Add intro content
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Informasi Area Distribusi', 20, introY + 30);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Katalog ini mencakup area distribusi: ${area || 'Semua Area'}`, 20, introY + 40);
    pdf.text('Harga dan ketersediaan produk dapat berbeda untuk setiap area distribusi.', 20, introY + 50);
    
    // Add ordering information
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Panduan Pemesanan', 20, introY + 70);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('1. Hubungi distributor Baskit terdekat atau tim sales kami', 20, introY + 80);
    pdf.text('2. Sebutkan kode SKU produk yang ingin dipesan', 20, introY + 90);
    pdf.text('3. Perhatikan MOQ (Minimum Order Quantity) setiap produk', 20, introY + 100);
    pdf.text('4. Konfirmasi harga dan ketersediaan produk', 20, introY + 110);
    
    // Add terms and conditions
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Syarat dan Ketentuan', 20, introY + 130);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('• Harga dapat berubah sewaktu-waktu tanpa pemberitahuan', 20, introY + 140);
    pdf.text('• Ketersediaan stok tergantung pada kapasitas produksi dan permintaan', 20, introY + 150);
    pdf.text('• Pemesanan harus memenuhi MOQ yang ditentukan', 20, introY + 160);
    pdf.text('• Biaya pengiriman tidak termasuk dalam harga produk', 20, introY + 170);
    
    // Add page break for product list
    pdf.addPage();
    
    // Add first content page with header
    let yPosition = addPageWithHeader();
    let xPosition = 10;
    const productsToExport = filteredProducts;
    const itemsPerRow = 4;
    const marginBetweenItems = 5; // Space between items
    const pageMargin = 10; // Margin from page edges
    
    // Calculate item dimensions to fit the page properly
    const availableWidth = pageWidth - (2 * pageMargin) - ((itemsPerRow - 1) * marginBetweenItems);
    const itemWidth = availableWidth / itemsPerRow;
    const itemHeight = itemWidth + 50; // Height is width plus space for text details
    
    // Draw a title for product list
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 102, 87); // Teal green
    pdf.setFontSize(14);
    pdf.text(`Daftar Produk - ${productsToExport.length} Produk`, pageMargin, yPosition + 5);
    yPosition += 10;
    
    // Process all products
    for (let i = 0; i < productsToExport.length; i++) {
      const product = productsToExport[i];
      const regional = product.regions.find(r => r.area === area) || product.regions[0];
      const usedPrice = regional?.distributorPrice ?? product.distributorPrice;
      const usedMoq = regional?.moq ?? product.moq;
      const margin = product.consumerPrice > 0 ? ((product.consumerPrice - usedPrice) / product.consumerPrice) * 100 : 0;
      
      // Calculate position
      const col = i % itemsPerRow;
      xPosition = pageMargin + (col * (itemWidth + marginBetweenItems));
      
      // Check if we need a new row
      if (col === 0 && i > 0) {
        yPosition += itemHeight + 10; // Add extra spacing between rows
      }
      
      // Check if we need a new page
      if (yPosition + itemHeight > pageHeight - pageMargin) {
        pdf.addPage();
        yPosition = addPageWithHeader();
      }
      
      // Create a clean product card with shadow effect
      // Draw shadow
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(xPosition + 1, yPosition + 1, itemWidth, itemHeight, 3, 3, 'F');
      
      // Draw white box
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(230, 230, 230);
      pdf.roundedRect(xPosition, yPosition, itemWidth, itemHeight, 3, 3, 'FD');
      
      // Draw the product image area
      pdf.setFillColor(245, 245, 245); // Light gray background for product
      pdf.roundedRect(xPosition + 5, yPosition + 5, itemWidth - 10, itemWidth - 10, 2, 2, 'F');
      
      // Draw product image placeholder text
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      if (product.brand) {
        pdf.text(product.brand.toUpperCase(), xPosition + itemWidth/2, yPosition + itemWidth/2 - 5, { align: 'center' });
      }
      if (product.name) {
        const nameLines = pdf.splitTextToSize(product.name.toUpperCase(), itemWidth - 20);
        pdf.text(nameLines, xPosition + itemWidth/2, yPosition + itemWidth/2 + 5, { align: 'center' });
      }
      
      // Starting Y position for product details (below the image)
      const detailsY = yPosition + itemWidth + 5;
      
      // Add category badge
      if (product.category) {
        pdf.setFillColor(242, 101, 34, 0.1); // Light orange background
        pdf.setDrawColor(242, 101, 34); // Orange border
        pdf.setTextColor(242, 101, 34); // Orange text
        pdf.setFontSize(6);
        
        const categoryText = product.category;
        const categoryWidth = pdf.getStringUnitWidth(categoryText) * 6 / pdf.internal.scaleFactor;
        
        // Draw badge background
        pdf.roundedRect(xPosition + 5, detailsY, categoryWidth + 6, 8, 2, 2, 'FD');
        // Draw category text
        pdf.text(categoryText, xPosition + 8, detailsY + 6);
      }
      
      // Product name
      pdf.setTextColor(0, 102, 87); // Teal green for product name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      // Split name if too long
      const nameLines = pdf.splitTextToSize(product.name, itemWidth - 10);
      pdf.text(nameLines, xPosition + 5, detailsY + 12);
      
      // Product size/ID
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(`${product.size} • SKU: ${product.id}`, xPosition + 5, detailsY + 18);
      
      // Divider line
      pdf.setDrawColor(240, 240, 240);
      pdf.line(xPosition + 5, detailsY + 22, xPosition + itemWidth - 5, detailsY + 22);
      
      // First row of details
      const row1Y = detailsY + 30;
      
      // Left column - Distributor Price
      pdf.setFillColor(0, 102, 87, 0.1); // Light teal background
      pdf.roundedRect(xPosition + 5, row1Y - 5, itemWidth/2 - 10, 22, 2, 2, 'F');
      
      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Harga Distributor', xPosition + 8, row1Y);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 102, 87); // Teal green
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatIDR(usedPrice), xPosition + 8, row1Y + 8);
      
      // Right column - Consumer Price
      pdf.setFillColor(242, 101, 34, 0.1); // Light orange background
      pdf.roundedRect(xPosition + itemWidth/2, row1Y - 5, itemWidth/2 - 5, 22, 2, 2, 'F');
      
      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Harga Konsumen', xPosition + itemWidth/2 + 3, row1Y);
      
      pdf.setFontSize(10);
      pdf.setTextColor(242, 101, 34); // Orange
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatIDR(product.consumerPrice), xPosition + itemWidth/2 + 3, row1Y + 8);
      
      // Second row of details
      const row2Y = row1Y + 25;
      
      // Create grid layout for additional details
      const columnWidth = (itemWidth - 10) / 2;
      
      // Margin and MOQ
      // Draw margin indicator
      let marginColor = [220, 53, 69]; // Red for low margin
      if (margin >= 30) {
        marginColor = [40, 167, 69]; // Green for high margin
      } else if (margin >= 15) {
        marginColor = [255, 193, 7]; // Yellow for medium margin
      }
      
      // Left column - Margin with color indicator
      pdf.setFillColor(marginColor[0], marginColor[1], marginColor[2], 0.1);
      pdf.roundedRect(xPosition + 5, row2Y - 5, columnWidth, 18, 2, 2, 'F');
      
      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Margin Distributor', xPosition + 8, row2Y);
      
      pdf.setFontSize(9);
      pdf.setTextColor(marginColor[0], marginColor[1], marginColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${margin.toFixed(1)}%`, xPosition + 8, row2Y + 8);
      
      // Right column - MOQ
      pdf.setFillColor(240, 240, 240); // Light gray
      pdf.roundedRect(xPosition + 5 + columnWidth + 2, row2Y - 5, columnWidth - 2, 18, 2, 2, 'F');
      
      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Min. Qty Pesanan', xPosition + 8 + columnWidth + 2, row2Y);
      
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${usedMoq}`, xPosition + 8 + columnWidth + 2, row2Y + 8);
      
      // Third row - Area
      const row3Y = row2Y + 20;
      
      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Area Distribusi', xPosition + 5, row3Y);
      
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.text(regional?.area || 'Semua Area', xPosition + 5, row3Y + 6);
      
      // Add updated date in small text at bottom
      const currentDate = new Date();
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const year = String(currentDate.getFullYear()).substring(2);
      
      pdf.setFontSize(5);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Updated: ${day}/${month}/${year}`, xPosition + 5, yPosition + itemHeight - 3);
    }
    
    // Add footer on each page with page numbers
    // For jsPDF typings, access the internal object and use appropriate method
    const totalPdfPages = pdf.internal.pages.length - 1;
    
    // Get current date for the footer
    const footerDate = new Date();
    
    // Go through all pages to add consistent footer
    for (let i = 1; i <= totalPdfPages; i++) {
      pdf.setPage(i);
      
      // Add colored footer
      pdf.setFillColor(0, 102, 87); // Teal green
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      // Add page number
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${totalPdfPages}`, pageWidth - 25, pageHeight - 5);
      
      // Add baskit info
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Baskit Distributor Catalog | ${footerDate.toLocaleDateString('id-ID')}`, 15, pageHeight - 5);
      
      // Add disclaimer text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(6);
      pdf.text('Harga dan ketersediaan stok dapat berubah sewaktu-waktu', pageWidth/2, pageHeight - 5, { align: 'center' });
    }
    
    // Move back to the last page
    pdf.setPage(totalPdfPages);
    
    // Add a final contact page
    pdf.addPage();
    const contactY = addPageWithHeader();
    
    // Add contact header
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 102, 87); // Teal green
    pdf.setFontSize(18);
    pdf.text('Kontak dan Pemesanan', 20, contactY + 10);
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, contactY + 15, pageWidth - 20, contactY + 15);
    
    // Add contact information
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(242, 101, 34); // Orange
    pdf.text('Hubungi Kami', 20, contactY + 40);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Email: info@baskit-distributor.com', 20, contactY + 60);
    pdf.text('Telepon: +62 822 1234 5678', 20, contactY + 75);
    pdf.text('Website: www.baskit-distributor.com', 20, contactY + 90);
    
    // Add sales representative info
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(242, 101, 34); // Orange
    pdf.text('Tim Sales', 20, contactY + 120);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    // Dummy sales team information
    const salesTeam = [
      { name: 'Budi Santoso', area: 'Jakarta', phone: '+62 812 3456 7890' },
      { name: 'Ani Wijaya', area: 'Bandung', phone: '+62 813 4567 8901' },
      { name: 'Dedi Kurniawan', area: 'Surabaya', phone: '+62 814 5678 9012' }
    ];
    
    let salesY = contactY + 140;
    salesTeam.forEach(person => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(person.name, 20, salesY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Area: ${person.area}`, 100, salesY);
      pdf.text(`${person.phone}`, 180, salesY);
      salesY += 15;
    });
    
    // Add QR code placeholder
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(pageWidth - 80, contactY + 40, 60, 60, 2, 2, 'F');
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Scan for Website', pageWidth - 50, contactY + 110, { align: 'center' });
    
    // Create filename based on active filters and date
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let filename = `baskit-distributor-catalog-${timestamp}`;
    if (area) filename += '-' + area.toLowerCase().replace(/\s+/g, '-');
    if (selectedBrand) filename += '-' + selectedBrand.toLowerCase().replace(/\s+/g, '-');
    filename += '.pdf';
    
    pdf.save(filename);
    
    // Show success notification
    toast({
      title: lang === 'id' ? 'Katalog Berhasil Diekspor' : 'Catalog Successfully Exported',
      description: lang === 'id' 
        ? `Katalog ${area ? area + ' ' : ''}berhasil diunduh dengan ${filteredProducts.length} produk` 
        : `${area ? area + ' ' : ''}Catalog successfully downloaded with ${filteredProducts.length} products`,
      variant: 'default'
    });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: lang === 'id' ? 'Gagal mengekspor PDF' : 'Failed to export PDF',
        description: lang === 'id' ? 'Terjadi kesalahan saat mengekspor katalog' : 'An error occurred while exporting the catalog',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
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
            {/* Area Distribution Filter - 3 columns */}
            <div className="md:col-span-3">
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
                  onClick={exportPDF} 
                  className="flex-1 md:w-auto bg-gradient-to-r from-[#00685a]/10 to-[#f26522]/5 hover:from-[#00685a]/20 hover:to-[#f26522]/10" 
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {lang === 'id' ? "Memproses Katalog..." : "Processing Catalog..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {lang === 'id' ? "Ekspor Katalog Lengkap" : "Export Full Catalog"}
                    </>
                  )}
                </Button>
                
                <div className="relative group">
                  <Button 
                    variant="default" 
                    className="w-full md:w-auto bg-[#00685a] hover:bg-[#00685a]/90" 
                    disabled={isExporting}
                    onClick={exportPDF}
                  >
                    {isExporting ? (
                      <>
                        <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                      </>
                    )}
                    {lang === 'id' ? "Katalog Premium" : "Premium Catalog"}
                  </Button>
                  
                  <div className="absolute hidden group-hover:block bottom-full mb-2 p-2 bg-[#00685a] text-white text-xs rounded shadow-lg w-48 right-0 z-10">
                    {lang === 'id' ? "Katalog dengan desain premium, cover eksklusif dan fitur tambahan" : "Catalog with premium design, exclusive cover and additional features"}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground text-right flex items-center md:ml-2">
                  {isExporting && (
                    <div className="flex items-center gap-2 text-green-600 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {lang === 'id' ? "Sedang memproses..." : "Processing..."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {lang === 'id'
            ? "Harga distributor akan terlihat setelah Anda masuk / mendaftar."
            : "Distributor prices will be visible after you login / register."
          }
        </p>
        <div ref={ref} className="space-y-4">
          <div className="border rounded-md p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">
                {lang === 'id' ? "Ringkasan Ekspor" : "Export Summary"}
              </div>
              <div className="text-muted-foreground">
                {lang === 'id' ? "Area: " : "Area: "}{area || (lang === 'id' ? 'Semua Area' : 'All Areas')} • 
                Brand: {selectedBrand || (lang === 'id' ? 'Semua Brand' : 'All Brands')} • 
                {lang === 'id' ? " Harga: " : " Price: "}{formatIDR(priceRange[0])} - {formatIDR(priceRange[1])} • 
                {lang === 'id' ? " Tanggal: " : " Date: "}{new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}
              </div>
            </div>
            <div className="text-muted-foreground">
              {lang === 'id' ? "Total Produk: " : "Total Products: "}{filteredProducts.length} 
              {currentPage > 1 && (lang === 'id' 
                ? ` (Halaman ${currentPage}/${paginationTotalPages})` 
                : ` (Page ${currentPage}/${paginationTotalPages})`
              )}
              {items?.length ? (lang === 'id' 
                ? ` • Item di Keranjang: ${items.length}` 
                : ` • Items in Cart: ${items.length}`
              ) : ''}
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
