import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChefHat,
  Croissant,
  Layers,
  LayoutDashboard,
  Package,
  ReceiptText,
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
      {
        label: "Pengunjung",
        href: "/admin/analytics",
        icon: BarChart3,
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
      {
        label: "Stok Jadi",
        href: "/admin/stock",
        icon: Boxes,
      },
    ],
  },
  {
    title: "Inventori",
    items: [
      {
        label: "Bahan Baku",
        href: "/admin/ingredients",
        icon: Package,
      },
      {
        label: "Pembelian",
        href: "/admin/ingredients/purchases",
        icon: ReceiptText,
      },
      {
        label: "Resep",
        href: "/admin/recipes",
        icon: ChefHat,
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
