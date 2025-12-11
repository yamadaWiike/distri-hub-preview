// React & Router
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// External Libraries
import useEmblaCarousel from "embla-carousel-react";

// UI Components
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/hooks/use-language";
import { useDistributorApproval } from "@/hooks/use-distributor-approval";

// Utils & Data
import { PRODUCTS, Product } from "@/data/products";
import { formatIDR, getProductIdFromSlug, generateProductSlug } from "@/lib/utils";
import { translations } from "@/lib/translations";
import { fetchProductBySku } from "@/lib/db";
import { getImageUrl } from "@/lib/s3-upload";
import { checkMixedVariantsMOQ } from "@/utils/mixVariants";
import { getAllProducts } from "@/services/product-service";
import { CartItem } from "@/contexts/CartContextDefinition";

export default function ProdukDetail() {
    const [failedImages, setFailedImages] = useState<number[]>([]);
  const { category, slug } = useParams();
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = translations[lang];
  const navigate = useNavigate();
  const distributorAccess = useDistributorApproval();
  
  // Reconstruct the full slug from category and slug params
  const fullSlug = category && slug ? `${category}/${slug}` : '';
  
  // Extract product ID from slug
  const idPrefix = fullSlug ? getProductIdFromSlug(fullSlug) : '';
  
  // Add some logging to debug
  console.log('ProdukDetail Debug:', { category, slug, fullSlug, idPrefix });
  
  // Add state for fetched product
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  
  // First look for product in hardcoded data using ID prefix
  const hardcodedProduct = PRODUCTS.find((p) => p.id.startsWith(idPrefix));
  
  // Always fetch product from database to get UOM data
  useEffect(() => {
    async function loadProduct() {
      if (idPrefix || hardcodedProduct) {
        try {
          let fetchedProduct = null;
          
          console.log('Attempting to fetch product:', { idPrefix, hardcodedProductId: hardcodedProduct?.id });
          
          // If we found the product in hardcoded data, use its full ID
          if (hardcodedProduct) {
            console.log('Fetching by hardcoded ID:', hardcodedProduct.id);
            fetchedProduct = await fetchProductBySku(hardcodedProduct.id);
          }
          
          // If not found by full ID and we have a prefix, try prefix search
          if (!fetchedProduct && idPrefix) {
            console.log('Fetching by ID prefix:', idPrefix);
            fetchedProduct = await fetchProductBySku(idPrefix);
          }
          
          console.log('Fetched product result:', fetchedProduct);
          
          if (fetchedProduct) {
            setProduct(fetchedProduct);
          } else {
            // Fallback to hardcoded if database fetch fails
            setProduct(hardcodedProduct || null);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          // Fallback to hardcoded if database fetch fails
          setProduct(hardcodedProduct || null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [idPrefix, hardcodedProduct]);
  
  // Fetch similar products
  useEffect(() => {
    async function loadSimilarProducts() {
      if (product) {
        try {
          const allProducts = await getAllProducts();
          // Filter similar products by category, brand, or region
          const similar = allProducts
            .filter(p => p.id !== product.id) // Exclude current product
            .filter(p => 
              p.category === product.category || 
              p.brand === product.brand ||
              p.regions.some(r => product.regions.some(pr => pr.area === r.area))
            )
            .slice(0, 12); // Limit to 12 products
          setSimilarProducts(similar);
        } catch (error) {
          console.error("Error fetching similar products:", error);
        }
      }
    }
    
    loadSimilarProducts();
  }, [product]);
  
  // Move hooks to the top level and use default values
  const [selectedArea, setSelectedArea] = useState('');
  const [qty, setQty] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  // Embla carousel for similar products
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Embla carousel for similar products
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1
  });
  
  // Initialize the state values when product changes
  useEffect(() => {
    if (product) {
      const initialRegional = product.regions[0];
      const allowMixVariants = Boolean(initialRegional?.allowMixVariants === true || product.allowMixVariants === true);
      const skuLevelMoq = Number(initialRegional?.skuLevelMoq || product.singleSkuMoq || 0);
      const canMixVariants = Boolean(allowMixVariants === true && product.hasVariants === true);
      const initialQty = canMixVariants ? 1 : product.moq;
      
      setSelectedArea(product.regions[0]?.area || '');
      setQty(initialQty);
      setCurrentImageIndex(0); // Reset image index when product changes
    }
  }, [product]);
  
  // Create product images array - use product.images if available, fallback to single image
  // Use image_url if available (already processed), otherwise use getImageUrl for proper S3 URL handling
  const productImages = product && product.images && product.images.length > 0
    ? product.images.map(img => {
        // If already a full URL, use as is, otherwise process through getImageUrl for S3
        if (img.startsWith('http') || img.startsWith('https')) {
          return img;
        }
        const s3Url = getImageUrl(img);
        return s3Url || img; // Fallback to original if getImageUrl returns null
      })
    : [(() => {
        // Check for image_url field first (from database, already processed)
        const productWithImageUrl = product as Product & { image_url?: string };
        if (productWithImageUrl?.image_url) {
          return productWithImageUrl.image_url;
        }
        // Fallback to processing image field
        if (product?.image) {
          if (product.image.startsWith('http') || product.image.startsWith('https')) {
            return product.image;
          }
          const s3Url = getImageUrl(product.image);
          return s3Url || product.image;
        }
        return '/placeholder.svg';
      })()];
  // Debug: log productImages array to check image URLs

  
  const hasMultipleImages = productImages.length > 1;
  
  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => prev === 0 ? productImages.length - 1 : prev - 1);
  };
  
  const goToNextImage = () => {
    setCurrentImageIndex((prev) => prev === productImages.length - 1 ? 0 : prev + 1);
  };
  
  if (loading) return <div className="min-h-screen"><Navbar /><main className="container max-w-6xl mx-auto py-10">{lang === 'id' ? "Memuat..." : "Loading..."}</main></div>;
  if (!product) return (
    <div className="min-h-screen">
      <SEO 
        title={lang === 'id' ? "Produk Tidak Ditemukan | Baskit" : "Product Not Found | Baskit"} 
        description={lang === 'id' ? "Produk yang Anda cari tidak ditemukan dalam katalog kami." : "The product you are looking for was not found in our catalog."} 
      />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-10">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">
            {lang === 'id' ? "Produk tidak ditemukan" : "Product not found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {lang === 'id' 
              ? `Produk "${fullSlug}" tidak tersedia dalam katalog kami saat ini.`
              : `Product "${fullSlug}" is not available in our current catalog.`
            }
          </p>
          <Button variant="default" onClick={() => window.history.back()}>
            {lang === 'id' ? "Kembali" : "Back"}
          </Button>
        </div>
      </main>
    </div>
  );
  const regional = product.regions.find((r) => r.area === selectedArea) || product.regions[0];
  const usedPrice = regional?.distributorPrice ?? product.distributorPrice;
  const usedMoq = regional?.moq ?? product.moq;
  
  // Mix variant logic
  const allowMixVariants = Boolean(regional?.allowMixVariants === true || product.allowMixVariants === true);
  const skuLevelMoq = Number(regional?.skuLevelMoq || product.singleSkuMoq || 0);
  // Display regular MOQ only (no conversions or SKU-level mixing)
  const displayMoq = usedMoq;
  const canMixVariants = Boolean(allowMixVariants === true && product.hasVariants === true);

  // Debug logging for MOQ inconsistency issue
  if (product.name.includes('Suno') || product.name.includes('Tobelo')) {
    console.log(`[MOQ DEBUG DETAIL] ${product.name}:`, {
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
  
  // Calculate content per carton from UOM conversion factors
  const pricingConversionFactor = product.pricing_conversion_factor || regional?.pricing_conversion_factor || 0;
  const contentPerCarton = pricingConversionFactor > 0 ? pricingConversionFactor : null;
  const baseUom = product.base_uom || 'pcs';

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title={`${product.name} ${product.size} | Baskit`} description={product.description} />
      <Navbar />
      
      <main className="container max-w-7xl mx-auto py-6 px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/daftar-produk')} className="hover:text-gray-900 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {lang === 'id' ? 'Kembali ke Katalog' : 'Back to Catalog'}
          </button>
          <span>/</span>
          <button onClick={() => navigate('/daftar-produk')} className="hover:text-gray-900">
            {lang === 'id' ? 'Katalog Produk' : 'Product Catalog'}
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.name} {product.size}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Product Images (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Product Image */}
            <div className="bg-white rounded-lg border overflow-hidden relative group">
              <img 
                src={productImages[currentImageIndex]} 
                alt={`${product.name} ${product.size}`} 
                className="w-full aspect-square object-contain cursor-pointer hover:scale-105 transition-transform duration-300" 
                onClick={() => setImageDialogOpen(true)}
              />
              
              {/* Navigation Arrows - Only show if multiple images */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Gallery - Only show if there are images */}
            {productImages.length > 0 && (
              <div className={`grid gap-2 ${productImages.length === 1 ? 'grid-cols-1' : productImages.length === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
                {productImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-white rounded-md border overflow-hidden cursor-pointer transition-all h-20 w-20 ${
                      currentImageIndex === idx ? 'ring-2 ring-orange-500 border-orange-500' : 'hover:border-gray-400'
                    }`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img 
                      src={getImageUrl(img) || img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover hover:opacity-75 transition"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.svg'; }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details (3 columns) */}
          <div className="lg:col-span-3 bg-white rounded-lg border p-6">
            {/* Category Badge */}
            <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded text-xs font-medium mb-3">
              {product.category}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name} {product.size}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-gray-600 mb-4">
              {product.brand} • {lang === 'id' ? 'Rasa Sapi Panggang' : 'Beef Flavor'}
            </p>

            {/* Description Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {lang === 'id' ? 'Deskripsi Produk' : 'Product Description'}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.description}
              </p>
              <button className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-2">
                {lang === 'id' ? 'Lihat lebih lanjut' : 'See more'}
              </button>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b">
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{lang === 'id' ? 'Garansi Kualitas' : 'Quality Guarantee'}</p>
                  <p className="text-xs text-gray-600">{lang === 'id' ? '100% Original' : '100% Original'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{lang === 'id' ? 'Estimasi Pengiriman' : 'Estimated Delivery'}</p>
                  <p className="text-xs text-gray-600">{lang === 'id' ? '1-3 Hari' : '1-3 Days'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{lang === 'id' ? 'Support 24/7' : 'Support 24/7'}</p>
                  <p className="text-xs text-gray-600">{lang === 'id' ? 'Siap Membantu' : 'Ready to Help'}</p>
                </div>
              </div>
            </div>

            {/* Area Distribution Selector */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {lang === 'id' ? 'Area Distribusi' : 'Distribution Area'}
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
              >
                {product.regions.map((r) => (
                  <option key={r.area} value={r.area}>{r.area}</option>
                ))}
              </select>
            </div>

            {/* MOQ Info Only - Stock Hidden */}
            <div className="mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-md border">
                <p className="text-xs text-gray-600 mb-1">MOQ</p>
                <p className="text-lg font-bold text-gray-900">{displayMoq} {lang === 'id' ? 'karton' : 'cartons'}</p>
                {canMixVariants && (
                  <p className="text-xs text-orange-600 mt-1">
                    {lang === 'id' ? 'Dapat dicampur varian' : 'Can mix variants'}
                  </p>
                )}
              </div>
            </div>

            {/* Price Details Section */}
            <div className="border-t border-b py-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {lang === 'id' ? 'Detail Harga' : 'Price Details'}
                </h3>
                <button className="text-orange-600 hover:text-orange-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>

              {contentPerCarton ? (
                <p className="text-xs text-gray-500 mb-3">
                  {lang === 'id' ? `Isi: ${contentPerCarton} ${baseUom}/karton` : `Content: ${contentPerCarton} ${baseUom}/carton`}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mb-3">
                  {lang === 'id' ? 'Isi: Informasi tidak tersedia' : 'Content: Information not available'}
                </p>
              )}

              {/* Distributor Price - Orange Background */}
              <div className="bg-orange-50 -mx-6 px-6 py-3 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lang === 'id' ? 'Harga Distributor' : 'Distributor Price'}</p>
                    <p className="text-xs text-gray-500">{lang === 'id' ? 'per karton' : 'per carton'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold text-orange-600 ${!user ? 'blur-sm select-none' : ''}`}>
                      {formatIDR(usedPrice)}
                    </p>
                    {contentPerCarton && (
                      <p className="text-xs text-gray-600">
                        {lang === 'id' ? `Per ${baseUom}` : `Per ${baseUom}`}: <span className={`font-semibold ${!user ? 'blur-sm select-none' : ''}`}>{formatIDR(Math.round(usedPrice / contentPerCarton))}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Retail Price */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{lang === 'id' ? 'Harga Retail' : 'Retail Price'}</p>
                  <p className="text-xs text-gray-500">{lang === 'id' ? 'per karton' : 'per carton'}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-gray-900">
                    {formatIDR(product.retailPrice || product.consumerPrice * 0.9)}
                  </p>
                  {contentPerCarton && (
                    <p className="text-xs text-gray-600">
                      {lang === 'id' ? `Per ${baseUom}` : `Per ${baseUom}`}: <span className="font-semibold">{formatIDR(Math.round((product.retailPrice || product.consumerPrice * 0.9) / contentPerCarton))}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Consumer Price */}
              <div className="flex justify-between items-start pb-3 mb-3 border-b">
                <div>
                  <p className="text-sm font-medium text-gray-900">{lang === 'id' ? 'Harga Konsumen' : 'Consumer Price'}</p>
                  <p className="text-xs text-gray-500">{lang === 'id' ? 'per karton' : 'per carton'}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-normal text-gray-900">
                    {formatIDR(product.consumerPrice)}
                  </p>
                  {contentPerCarton && (
                    <p className="text-xs text-gray-600">
                      {lang === 'id' ? `Per ${baseUom}` : `Per ${baseUom}`}: <span className="font-normal">{formatIDR(Math.round(product.consumerPrice / contentPerCarton))}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Note */}
              {contentPerCarton && (
                <p className="text-xs text-gray-500 italic">
                  {lang === 'id' 
                    ? `*Harga per ${baseUom} hanya untuk informasi, pembelian minimal ${displayMoq} karton`
                    : `*Price per ${baseUom} is for information only, minimum purchase ${displayMoq} cartons`}
                </p>
              )}

              {/* Estimated Margin */}
              <div className="bg-teal-50 -mx-6 px-6 py-3 mt-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-900">
                    {lang === 'id' ? `Estimasi Margin (${qty} karton)` : `Estimated Margin (${qty} cartons)`}
                  </p>
                  <p className={`text-base font-bold text-teal-600 ${!user ? 'blur-sm select-none' : ''}`}>
                    {formatIDR(Math.round(((product.retailPrice || product.consumerPrice * 0.9) - usedPrice) * qty))} ({((((product.retailPrice || product.consumerPrice * 0.9) - usedPrice) / (product.retailPrice || product.consumerPrice * 0.9)) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            {user && distributorAccess.canPlaceOrders && user.profileComplete ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    {lang === 'id' ? 'Jumlah Pesanan' : 'Order Quantity'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-md overflow-hidden">
                      <button 
                        onClick={() => {
                          const minQty = canMixVariants ? 1 : usedMoq;
                          setQty(Math.max(minQty, qty - 1));
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-semibold"
                      >
                        −
                      </button>
                      <input 
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                        className="w-16 h-10 border-transparent text-center rounded-md bg-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                        min={1}
                        readOnly={!canMixVariants}
                      />
                      <button 
                        onClick={() => {
                          const newQty = qty + 1;
                          if (canMixVariants) {
                            setQty(newQty);
                          } else {
                            // For non-mix variants, set to MOQ
                            setQty(usedMoq);
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <div>
                  <Button 
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: lang === 'id' ? 'Silakan masuk untuk melanjutkan' : 'Please log in to continue',
                          description: lang === 'id' ? 'Anda perlu masuk ke akun Anda untuk menambahkan produk ke keranjang.' : 'You need to log in to your account to add products to the cart.',
                          variant: 'default',
                        });
                        return;
                      }
                      
                      // Check if product is already in cart
                      const existingItem = items.find(item => item.id === product.id);

                      // Build CartItem
                      const cartItem: CartItem = {
                        id: product.id,
                        name: product.name,
                        size: product.size,
                        image: productImages[0],
                        province: selectedArea,
                        unitPrice: usedPrice,
                        moq: product.moq,
                        qty: canMixVariants ? qty : usedMoq,
                        consumerPrice: product.consumerPrice,
                        // add other fields as needed
                      };

                      addItem(cartItem);
                      toast({
                        title: lang === 'id' ? (canMixVariants ? 'Produk ditambahkan ke keranjang' : (existingItem ? 'Keranjang diperbarui' : 'Produk ditambahkan ke keranjang')) : (canMixVariants ? 'Product added to cart' : (existingItem ? 'Cart updated' : 'Product added to cart')),
                        description: lang === 'id' ? (canMixVariants ? 'Anda telah menambahkan varian produk ke keranjang.' : (existingItem ? 'Jumlah produk dalam keranjang telah diperbarui.' : 'Anda telah menambahkan produk ke keranjang.')) : (canMixVariants ? 'You have added the product variant to the cart.' : (existingItem ? 'The product quantity in the cart has been updated.' : 'You have added the product to the cart.')),
                        variant: 'default',
                      });
                    }}
                    className="w-full h-12 text-sm font-semibold"
                  >
                    {lang === 'id' ? 'Tambahkan ke Keranjang' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            ) : user && distributorAccess.isActive && !user.profileComplete ? (
              <Alert className="bg-orange-50 border-orange-300">
                <AlertDescription className="space-y-3">
                  <p className="text-orange-800 font-medium text-center">
                    {lang === 'id'
                      ? 'Lengkapi profil Anda untuk dapat memesan produk.'
                      : 'Complete your profile to be able to order products.'}
                  </p>
                  <Link to="/lengkapi-profil" className="block">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                      {lang === 'id' ? 'Lengkapi Profil Disini' : 'Complete Profile Here'}
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  {lang === 'id' ? 'Anda perlu masuk untuk melihat harga dan menambahkan produk ke keranjang.' : 'You need to log in to view prices and add products to the cart.'}
                </p>
                <Button variant="default" onClick={() => navigate('/masuk')}>
                  {lang === 'id' ? 'Masuk ke Akun' : 'Log In'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Carousel - Only show if there are similar products */}
        {similarProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {lang === 'id' ? 'Produk Serupa' : 'Similar Products'}
            </h2>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {similarProducts.map((similarProduct) => (
                  <div className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] pl-4" key={similarProduct.id}>
                    <div className="bg-white rounded-lg border overflow-hidden shadow hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/${similarProduct.category}/${generateProductSlug(similarProduct)}`)}>
                      <img 
                        src={similarProduct.image} 
                        alt={similarProduct.name} 
                        className="w-full h-40 object-cover" 
                      />
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {similarProduct.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {similarProduct.brand}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900">
                            {formatIDR(similarProduct.distributorPrice)}
                          </p>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cartItem: CartItem = {
                                id: similarProduct.id,
                                name: similarProduct.name,
                                size: similarProduct.size,
                                image: similarProduct.image,
                                province: selectedArea,
                                unitPrice: similarProduct.distributorPrice,
                                moq: similarProduct.moq,
                                qty: similarProduct.moq,
                                consumerPrice: similarProduct.consumerPrice,
                              };
                              addItem(cartItem);
                              toast({
                                title: lang === 'id' ? 'Produk ditambahkan ke keranjang' : 'Product added to cart',
                                description: lang === 'id' ? 'Anda telah menambahkan produk serupa ke keranjang.' : 'You have added the similar product to the cart.',
                                variant: 'default',
                              });
                            }}
                          >
                            {lang === 'id' ? 'Tambah' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Dialog - Fullscreen Product Image */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-3xl p-0">
            <DialogDescription>
              <div className="relative">
                <img 
                  src={productImages[currentImageIndex]} 
                  alt={`${product.name} ${product.size}`} 
                  className="w-full h-auto"
                />
                
                {/* Close Button */}
                <button
                  onClick={() => setImageDialogOpen(false)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
