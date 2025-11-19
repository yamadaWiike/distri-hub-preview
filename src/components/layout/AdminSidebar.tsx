import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  UserCheck,
  Activity,
  BarChart3,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    id: "dashboard",
    label: { id: "Dashboard", en: "Dashboard" },
    path: "/admin",
    icon: LayoutDashboard
  },
  {
    id: "activities",
    label: { id: "Semua Aktivitas", en: "All Activities" },
    path: "/admin/activities",
    icon: Activity
  },
  {
    id: "distributors",
    label: { id: "Kelola Distributor", en: "Manage Distributors" },
    path: "/admin/distributors",
    icon: UserCheck
  },
  {
    id: "users",
    label: { id: "Kelola Pengguna", en: "Manage Users" },
    path: "/admin/users",
    icon: Users
  },
  {
    id: "products",
    label: { id: "Kelola Produk", en: "Manage Products" },
    path: "/admin/products",
    icon: Package
  },
  {
    id: "orders",
    label: { id: "Kelola Pesanan", en: "Manage Orders" },
    path: "/admin/orders",
    icon: ShoppingBag
  },
  {
    id: "analytics",
    label: { id: "Analitik", en: "Analytics" },
    path: "/admin/analytics",
    icon: BarChart3
  },
  {
    id: "reports",
    label: { id: "Laporan", en: "Reports" },
    path: "/admin/reports",
    icon: FileText
  }
];

interface AdminSidebarProps {
  lang: 'id' | 'en';
}

export default function AdminSidebar({ lang }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-1">
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            {lang === 'id' ? 'Menu Admin' : 'Admin Menu'}
          </h2>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-50 text-orange-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label[lang]}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
