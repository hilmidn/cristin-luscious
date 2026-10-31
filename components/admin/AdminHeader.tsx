"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Menu } from "lucide-react";

type AdminHeaderProps = {
  user: {
    name: string;
    email: string;
  };
  today: string;
  onMenuClick: () => void;
};

function getPageLabel(pathname: string) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname === "/admin/products") return "Produk";
  if (pathname === "/admin/products/new") return "Produk Baru";
  if (pathname.startsWith("/admin/products/")) return "Edit Produk";

  return "Dashboard";
}

export default function AdminHeader({
  user,
  today,
  onMenuClick,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const pageLabel = getPageLabel(pathname);
  const initial = user.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-brand-border bg-brand-bg/90 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Buka menu"
        className="border border-brand-border bg-brand-card p-2 text-brand-dark transition-colors hover:border-brand-text lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2 font-sans text-[9px] font-semibold uppercase tracking-[0.25em] text-brand-text">
        <span>Admin</span>
        <span className="text-brand-muted">/</span>
        <span className="text-brand-dark">{pageLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden items-center gap-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-text md:flex">
          <CalendarDays size={13} strokeWidth={1.6} />
          {today}
        </span>

        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-2 border border-brand-border bg-brand-card px-3 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark sm:flex"
        >
          Lihat Website
          <ArrowUpRight size={12} />
        </Link>

        <div
          title={`${user.name} — ${user.email}`}
          className="flex h-8 w-8 items-center justify-center border border-brand-border bg-brand-card font-playfair text-xs font-bold text-brand-dark lg:hidden"
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
