import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Croissant,
  Layers,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const adminNav: AdminNavGroup[] = [
  {
    title: "Utama",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Katalog",
    items: [
      {
        label: "Produk",
        href: "/admin/products",
        icon: Croissant,
      },
    ],
  },
  {
    title: "Penjualan",
    items: [
      {
        label: "Pesanan",
        href: "/admin/orders",
        icon: ShoppingBag,
      },
      {
        label: "Pelanggan",
        href: "/admin/customers",
        icon: Users,
      },
      {
        label: "Laporan Produk",
        href: "/admin/reports/products",
        icon: BarChart3,
      },
      {
        label: "Rekap Pesanan",
        href: "/admin/orders/recap",
        icon: Layers,
      },
    ],
  },
  {
    title: "Produksi",
    items: [
      {
        label: "Kalender Produksi",
        href: "/admin/production",
        icon: CalendarDays,
      },
    ],
  },
  {
    title: "Sistem",
    items: [
      {
        label: "Pengaturan",
        href: "/admin/settings",
        icon: Settings,
        soon: true,
      },
    ],
  },
];
