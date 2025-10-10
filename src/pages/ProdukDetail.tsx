import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { useParams, useNavigate } from "react-router-dom";
import { PRODUCTS, Product } from "@/data/products";
import { useAuth } from "@/hooks/use-auth";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatIDR } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { useToast } from "@/components/ui/use-toast";
import { fetchProductBySku } from "@/lib/db";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";

export default function ProdukDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = translations[lang];
  const navigate = useNavigate();
  
  // Add state for fetched product
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // First look for product in hardcoded data
  const hardcodedProduct = PRODUCTS.find((p) => p.id === id);
  
  // Always fetch product from database to get UOM data
  useEffect(() => {
    async function loadProduct() {
      if (id) {
        try {
          const fetchedProduct = await fetchProductBySku(id);
          if (fetchedProduct) {
            setProduct(fetchedProduct);
          } else {
            // Fallback to hardcoded if database fetch fails
            setProduct(hardcodedProduct);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          // Fallback to hardcoded if database fetch fails
          setProduct(hardcodedProduct);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadProduct();
  }, [id, hardcodedProduct]);
  
  // Move hooks to the top level and use default values
  const [selectedArea, setSelectedArea] = useState('');
  const [qty, setQty] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  // Initialize the state values when product changes
  useEffect(() => {
    if (product) {
      setSelectedArea(product.regions[0]?.area || '');
      setQty(product.moq);
    }
  }, [product]);
  
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
              ? `SKU "${id}" tidak tersedia dalam katalog kami saat ini.`
              : `SKU "${id}" is not available in our current catalog.`
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

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${product.name} — ${product.size} | Baskit`} description={product.description} />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">{product.name} — {product.size}</h1>
          <p className="text-sm text-muted-foreground">{product.category} • {product.brand}</p>
        </header>
        <section className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div 
              className="cursor-pointer relative group" 
              onClick={() => setImageDialogOpen(true)}
            >
              <img 
                src={product.image || '/placeholder.svg'} 
                alt={`${product.name} — ${product.size}`} 
                className="w-full h-64 object-cover rounded-md transition-transform duration-300 group-hover:scale-[1.02]" 
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                <span className="bg-white/80 text-black text-xs font-medium px-2 py-1 rounded">
                  {lang === 'id' ? "Klik untuk memperbesar" : "Click to enlarge"}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
          
          {/* Image Dialog */}
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogContent className="max-w-3xl p-1 border-none">
              <DialogDescription className="sr-only">
                Product image preview for {product.name}
              </DialogDescription>
              <img 
                src={product.image || '/placeholder.svg'} 
                alt={`${product.name} — ${product.size}`} 
                className="w-full h-auto object-contain max-h-[80vh] rounded-md"
              />
            </DialogContent>
          </Dialog>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">
                {lang === 'id' ? 
                  `Harga Pelanggan${product.pricing_uom && product.pricing_uom !== 'pcs' ? ` (per ${product.pricing_uom})` : ` (per ${product.pricing_uom || 'pcs'})`}` : 
                  `Customer Price${product.pricing_uom && product.pricing_uom !== 'pcs' ? ` (per ${product.pricing_uom})` : ` (per ${product.pricing_uom || 'pcs'})`}`
                }
              </div>
              <div className="text-lg font-medium">{formatIDR(product.consumerPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const priceUom = product.pricing_uom && product.pricing_uom !== 'pcs' ? product.pricing_uom : (regional?.price_uom || 'pcs');
                  return lang === 'id' ? 
                    `Harga Distributor${priceUom !== 'pcs' ? ` (per ${priceUom})` : ' (per pcs)'}` : 
                    `Distributor Price${priceUom !== 'pcs' ? ` (per ${priceUom})` : ' (per pcs)'}`;
                })()}
              </div>
              <div className={`text-lg font-medium ${user ? '' : 'blur-sm select-none'}`}>{formatIDR(usedPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">MOQ</div>
              <div className="text-lg font-medium">{usedMoq} {product.moq_uom && product.moq_uom !== 'pcs' ? product.moq_uom : (regional?.moq_uom || 'pcs')}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                {lang === 'id' ? "Stok" : "Stock"}
              </div>
              <div className="text-lg font-medium">{product.stock || 0} pcs</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {lang === 'id' ? "Area Distribusi" : "Distribution Area"}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {product.regions.map((r) => (
                  <span key={r.area} className="px-2 py-1 rounded-md border">{r.area}</span>
                ))}
              </div>
            </div>
            {user && (
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs text-muted-foreground">
                    {lang === 'id' ? "Pilih Area" : "Select Area"}
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {product.regions.map((r) => (
                      <option key={r.area} value={r.area}>{r.area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    {lang === 'id' ? "Kuantitas" : "Quantity"}
                  </label>
                  <input type="number" min={usedMoq} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '0'))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <Button 
                    variant="hero" 
                    className="w-full mt-5" 
                    onClick={() => {
                      // Get the regional and product mix variant settings
                      const regional = product.regions.find(r => r.area === selectedArea) || product.regions[0];
                      const allowMixVariants = Boolean(regional?.allowMixVariants === true || product.allowMixVariants === true);
                      const skuLevelMoq = Number(regional?.skuLevelMoq || product.singleSkuMoq || 0);
                      
                      addItem({
                        id: product.id, 
                        name: product.name, 
                        size: product.size, 
                        image: product.image, 
                        province: selectedArea, 
                        unitPrice: usedPrice, 
                        moq: usedMoq, 
                        qty: qty, // Use exactly what the user specified 
                        consumerPrice: product.consumerPrice,
                        // Add mix variant properties
                        allowMixVariants: allowMixVariants,
                        skuLevelMoq: skuLevelMoq,
                        // Note: ProdukDetail currently doesn't handle variant information
                        // This will be added when variant selection UI is implemented
                      });
                      
                      // Show toast notification
                      toast({
                        title: `${product.name} ${product.size}`,
                        description: lang === 'id' 
                          ? `${qty} item ditambahkan ke keranjang` 
                          : `${qty} items added to cart`,
                        duration: 3000,
                        action: (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate('/checkout')}
                          >
                            {lang === 'id' ? "Checkout" : "Checkout"}
                          </Button>
                        ),
                      });
                    }}
                  >
                    {lang === 'id' ? "Tambah ke Keranjang" : "Add to Cart"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">
            {lang === 'id' ? "Harga & MOQ per Area Distribusi" : "Price & MOQ by Distribution Area"}
          </h2>
          <div className="divide-y border rounded-lg">
            {/* Table Headers */}
            <div className="grid grid-cols-3 gap-3 p-3 text-xs font-semibold text-muted-foreground bg-muted/30">
              <div>{lang === 'id' ? "Area" : "Area"}</div>
              <div>{lang === 'id' ? "Harga Distributor" : "Distributor Price"}</div>
              <div>{lang === 'id' ? "MOQ" : "MOQ"}</div>
            </div>
            {product.regions.map((r) => {
              const moqUom = product.moq_uom && product.moq_uom !== 'pcs' ? product.moq_uom : (r.moq_uom || 'pcs');
              const priceUom = product.pricing_uom && product.pricing_uom !== 'pcs' ? product.pricing_uom : (r.price_uom || 'pcs');
              return (
                <div key={r.area} className="grid grid-cols-3 gap-3 p-3 text-sm">
                  <div className="font-medium">{r.area}</div>
                  <div className={`${user ? '' : 'blur-sm select-none'}`}>
                    {formatIDR(r.distributorPrice)}
                    {priceUom !== 'pcs' && <span className="text-xs text-muted-foreground ml-1">/{priceUom}</span>}
                  </div>
                  <div>{r.moq} {moqUom}</div>
                </div>
              );
            })}
          </div>
          {!user && <p className="text-sm text-muted-foreground mt-2">
            {lang === 'id' 
              ? "Masuk untuk melihat harga dan simulasi lengkap." 
              : "Login to view complete pricing and simulation."}
          </p>}
        </section>
      </main>
    </div>
  );
}
