"use client";

import { useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

type AdminShellProps = {
  user: {
    name: string;
    email: string;
  };
  today: string;
  year: number;
  children: React.ReactNode;
};

export default function AdminShell({
  user,
  today,
  year,
  children,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <AdminHeader
          user={user}
          today={today}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {children}
        </main>

        <footer className="border-t border-brand-border px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 font-sans text-[9px] font-semibold uppercase tracking-[0.25em] text-brand-text sm:flex-row sm:items-center sm:justify-between">
            <span>© {year} Cristin Luscious</span>
            <span className="text-brand-muted">Admin Atelier</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
