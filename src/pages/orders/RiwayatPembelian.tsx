import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, PackageSearch, ReceiptText } from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import SEO from "@/components/seo/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { formatIDR } from "@/lib/utils";

type DistributorProfile = {
  id: string;
  user_id: string;
  nama_bisnis?: string | null;
};

type PurchaseOrder = {
  id: string;
  order_number?: string | null;
  status?: string | null;
  total_amount?: number | null;
  total?: number | null;
  created_at?: string | null;
};

const statusTone: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export default function RiwayatPembelian() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [profile, setProfile] = useState<DistributorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data: distributorProfile } = await supabase
        .from("distributor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const typedProfile = distributorProfile as DistributorProfile | null;
      setProfile(typedProfile);

      if (!typedProfile?.id) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      const { data: orderRows } = await supabase
        .from("orders")
        .select("*")
        .eq("distributor_id", typedProfile.id)
        .order("created_at", { ascending: false });

      setOrders((orderRows || []) as PurchaseOrder[]);
      setIsLoading(false);
    };

    fetchHistory();
  }, [user?.id]);

  const totalSpend = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + (order.total_amount || order.total || 0),
        0
      ),
    [orders]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={
          lang === "id"
            ? "Riwayat Pembelian | Baskit"
            : "Purchase History | Baskit"
        }
        description={
          lang === "id"
            ? "Lihat daftar pembelian distributor Anda."
            : "View your distributor purchase history."
        }
      />
      <Navbar />

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {profile?.nama_bisnis || user?.email}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {lang === "id" ? "Riwayat Pembelian" : "Purchase History"}
            </h1>
          </div>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link to="/daftar-produk">
              {lang === "id" ? "Belanja Lagi" : "Shop Again"}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {lang === "id" ? "Total Pesanan" : "Total Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {orders.length}
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {lang === "id" ? "Total Nilai Pembelian" : "Total Purchase Value"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatIDR(totalSpend)}
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
            {lang === "id" ? "Memuat riwayat..." : "Loading history..."}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center">
            <PackageSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {lang === "id" ? "Belum ada pesanan" : "No orders yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "id"
                ? "Pesanan yang berhasil dibuat akan muncul di sini."
                : "Completed orders will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = order.status || "pending";
              const total = order.total_amount || order.total || 0;

              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-orange-50 p-2 text-orange-600">
                      <ReceiptText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {order.order_number || order.id}
                        </p>
                        <Badge
                          variant="outline"
                          className={statusTone[status] || "bg-slate-50"}
                        >
                          {status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-muted-foreground">
                      {lang === "id" ? "Total" : "Total"}
                    </p>
                    <p className="text-lg font-semibold">{formatIDR(total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
