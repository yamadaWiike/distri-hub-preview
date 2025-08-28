import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { useParams } from "react-router-dom";
import { PRODUCTS } from "@/data/products";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function ProdukDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) return <div className="min-h-screen"><Navbar /><main className="container max-w-6xl mx-auto py-10">Produk tidak ditemukan.</main></div>;

  const [selectedArea, setSelectedArea] = useState(product.regions[0]?.area || '');
  const [qty, setQty] = useState(product.moq);
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
            <img src={product.image || '/placeholder.svg'} alt={`${product.name} — ${product.size}`} className="w-full h-64 object-cover rounded-md" />
            <p className="text-muted-foreground">{product.description}</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Harga Konsumen (per pcs)</div>
              <div className="text-lg font-medium">{formatIDR(product.consumerPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Harga Konsumen (per karton)</div>
              <div className="text-lg font-medium">—</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Harga Distributor</div>
              <div className={`text-lg font-medium ${user ? '' : 'blur-sm select-none'}`}>{formatIDR(usedPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">MOQ</div>
              <div className="text-lg font-medium">{usedMoq} pcs</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Area Distribusi</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {product.regions.map((r) => (
                  <span key={r.area} className="px-2 py-1 rounded-md border">{r.area}</span>
                ))}
              </div>
            </div>
            {user && (
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs text-muted-foreground">Pilih Area</label>
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
                  <label className="text-xs text-muted-foreground">Kuantitas</label>
                  <input type="number" min={usedMoq} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '0'))} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <Button variant="hero" className="w-full mt-5" onClick={() => addItem({ id: product.id, name: product.name, size: product.size, image: product.image, province: selectedArea, unitPrice: usedPrice, moq: usedMoq, qty: Math.max(qty, usedMoq), consumerPrice: product.consumerPrice })}>Add to Cart</Button>
                </div>
              </div>
            )}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Harga & MOQ per Area Distribusi</h2>
          <div className="divide-y border rounded-lg">
            {product.regions.map((r) => (
              <div key={r.area} className="grid grid-cols-3 gap-3 p-3 text-sm">
                <div className="font-medium">{r.area}</div>
                <div className={`${user ? '' : 'blur-sm select-none'}`}>{formatIDR(r.distributorPrice)}</div>
                <div>{r.moq} pcs</div>
              </div>
            ))}
          </div>
          {!user && <p className="text-sm text-muted-foreground mt-2">Masuk untuk melihat harga dan simulasi lengkap.</p>}
        </section>
      </main>
    </div>
  );
}
