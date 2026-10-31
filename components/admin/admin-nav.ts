import type { LucideIcon } from "lucide-react";
import {
  Croissant,
  LayoutDashboard,
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
        soon: true,
      },
      {
        label: "Pesanan",
        href: "/admin/orders",
        icon: ShoppingBag,
        soon: true,
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
