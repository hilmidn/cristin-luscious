"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { adminNav } from "./admin-nav";

type AdminSidebarProps = {
  open: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
  };
};

export default function AdminSidebar({
  open,
  onClose,
  user,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const initial = user.name.trim().charAt(0).toUpperCase() || "A";

  // Href terpanjang yang cocok, supaya /admin/orders/recap tidak ikut
  // menyalakan menu /admin/orders.
  const activeHref = adminNav
    .flatMap((group) => group.items)
    .filter((item) => !item.soon)
    .map((item) => item.href)
    .filter(
      (href) =>
        pathname === href ||
        (href !== "/admin" && pathname.startsWith(`${href}/`)),
    )
    .sort((a, b) => b.length - a.length)[0];

  return (
    <>
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-brand-dark/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-brand-border bg-brand-bg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="relative border-b border-brand-border px-6 py-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="absolute right-4 top-4 p-1.5 text-brand-text transition-colors hover:text-brand-dark lg:hidden"
          >
            <X size={18} />
          </button>

          <Link href="/admin" className="flex flex-col" onClick={onClose}>
            <Image
              src="/logo.png"
              alt="Cristin Luscious"
              width={400}
              height={120}
              className="h-12 w-auto"
              priority
            />
            <span className="mt-2 font-sans text-[9px] font-bold uppercase tracking-[0.32em] text-brand-text">
              Admin Atelier
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-7">
            {adminNav.map((group) => (
              <div key={group.title}>
                <p className="mb-3 px-3 font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-muted">
                  {group.title}
                </p>

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = !item.soon && item.href === activeHref;

                    if (item.soon) {
                      return (
                        <li key={item.href}>
                          <div
                            aria-disabled="true"
                            className="flex cursor-not-allowed items-center gap-3 px-3 py-2.5 text-brand-muted"
                          >
                            <Icon size={16} strokeWidth={1.6} />
                            <span className="flex-1 font-sans text-[11px] font-semibold uppercase tracking-[0.18em]">
                              {item.label}
                            </span>
                            <span className="border border-brand-border px-1.5 py-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-brand-muted">
                              Soon
                            </span>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          className={`group flex items-center gap-3 px-3 py-2.5 transition-colors duration-300 ${
                            isActive
                              ? "bg-brand-dark text-brand-bg"
                              : "text-brand-text hover:bg-brand-card hover:text-brand-dark"
                          }`}
                        >
                          <Icon size={16} strokeWidth={1.6} />
                          <span className="flex-1 font-sans text-[11px] font-semibold uppercase tracking-[0.18em]">
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="h-1.5 w-1.5 bg-brand-bg" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-brand-border px-4 py-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-brand-border bg-brand-card font-playfair text-sm font-bold text-brand-dark">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
                {user.name}
              </p>
              <p className="truncate font-sans text-[10px] text-brand-text">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="mt-2 flex w-full items-center gap-3 px-3 py-2.5 text-brand-text transition-colors duration-300 hover:bg-brand-card hover:text-brand-dark"
          >
            <LogOut size={16} strokeWidth={1.6} />
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]">
              Keluar
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
