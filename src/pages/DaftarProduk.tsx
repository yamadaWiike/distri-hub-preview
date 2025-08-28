import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { PRODUCTS, ALL_AREAS, Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/contexts/CartContext";
function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function ProductCard({ product, loggedIn }: { product: Product; loggedIn: boolean }) {
  const { addItem } = useCart();
  const [selectedArea, setSelectedArea] = useState(product.regions[0]?.area || '');
  const [qty, setQty] = useState(product.moq);
  const regional = product.regions.find((r) => r.area === selectedArea) || product.regions[0];
  const usedPrice = regional?.distributorPrice ?? product.distributorPrice;
  const usedMoq = regional?.moq ?? product.moq;
  const subtotalDistributor = qty * usedPrice;
  const potentialRevenue = qty * product.consumerPrice;
  const profit = potentialRevenue - subtotalDistributor;
  const margin = potentialRevenue > 0 ? (profit / potentialRevenue) * 100 : 0;

  return (
    <article className="border rounded-lg p-4 flex flex-col gap-3">
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

      <div className="mt-2">
        {loggedIn ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Area Distribusi</label>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setQty((q) => Math.max(q, usedMoq));
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
                  onChange={(e) => setQty(parseInt(e.target.value || '0'))}
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
            <Button
              variant="hero"
              size="sm"
              className="w-full"
              onClick={() => addItem({
                id: product.id,
                name: product.name,
                size: product.size,
                image: product.image,
                province: regional?.area || '',
                unitPrice: usedPrice,
                moq: usedMoq,
                qty: Math.max(qty, usedMoq),
                consumerPrice: product.consumerPrice,
              })}
            >
              Add to Cart
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Masuk untuk menggunakan simulasi dan melihat harga distributor.</div>
            <Link to="/masuk"><Button variant="hero" size="sm">Lihat Harga</Button></Link>
          </div>
        )}
      </div>
    </article>
  );
}

export default function DaftarProduk() {
  const { user } = useAuth();
  const { items } = useCart();
  const [area, setArea] = useState<string>(() => {
    const p = user?.kota || "";
    return ALL_AREAS.includes(p) ? p : "";
  });
  const ref = useRef<HTMLDivElement>(null);

  const priceBounds = useMemo<[number, number]>(() => {
    const prices = PRODUCTS.map((p) => p.consumerPrice);
    return [Math.min(...prices), Math.max(...prices)];
  }, []);

  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const prices = PRODUCTS.map((p) => p.consumerPrice);
    return [Math.min(...prices), Math.max(...prices)];
  });

  const products = useMemo(() => {
    const base = area
      ? PRODUCTS.filter((p) => p.regions.some((r) => r.area === area))
      : PRODUCTS;
    return base.filter(
      (p) => p.consumerPrice >= priceRange[0] && p.consumerPrice <= priceRange[1]
    );
  }, [area, priceRange]);
  const exportPDF = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let position = 10;

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
    pdf.save(`daftar-produk${area ? '-' + area : ''}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Daftar Produk | Baskit Distributor Hub" description="Lihat katalog produk Baskit, harga konsumen, MOQ, dan harga distributor (setelah masuk)." />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Daftar Produk</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Area Distribusi</div>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
                aria-label="Filter area distribusi"
              >
                <option value="">Semua Area</option>
                {ALL_AREAS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">Harga Konsumen</div>
              <span className="text-sm">{formatIDR(priceRange[0])}</span>
              <div className="w-40 sm:w-56">
                <Slider
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  step={500}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange([v[0], v[1]])}
                />
              </div>
              <span className="text-sm">{formatIDR(priceRange[1])}</span>
            </div>
            <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Harga distributor akan terlihat setelah Anda masuk / mendaftar.</p>
        <div ref={ref} className="space-y-4">
          <div className="border rounded-md p-3 text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">Ringkasan Ekspor</div>
              <div className="text-muted-foreground">Area: {area || 'Semua Area'} • Tanggal: {new Date().toLocaleDateString('id-ID')}</div>
            </div>
            <div className="text-muted-foreground">Total Produk: {products.length}{items?.length ? ` • Item di Keranjang: ${items.length}` : ''}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} loggedIn={!!user} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
