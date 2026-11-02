import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChefHat,
  Croissant,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
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
    title: "Inventori",
    items: [
      {
        label: "Bahan Baku",
        href: "/admin/ingredients",
        icon: Package,
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
