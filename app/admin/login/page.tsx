import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Area masuk pengelola Cristin Luscious.",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="grid min-h-screen bg-brand-bg text-brand-dark lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-brand-dark p-12 text-brand-bg lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 opacity-10">
          <div className="border-r border-brand-bg" />
          <div className="border-r border-brand-bg" />
          <div />
        </div>

        <span className="pointer-events-none absolute -bottom-10 -right-4 select-none font-script text-[11rem] leading-none text-brand-bg/5 xl:text-[15rem]">
          Luscious
        </span>

        <Link href="/" className="relative z-10 flex w-fit flex-col">
          <Image
            src="/logo.png"
            alt="Cristin Luscious"
            width={400}
            height={120}
            className="h-14 w-auto brightness-0 invert"
            priority
          />
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.4em] text-brand-bg/50">
            Admin Atelier
          </span>

          <h1 className="mt-4 font-playfair text-4xl font-bold uppercase leading-[0.95] tracking-tight xl:text-5xl">
            Kelola kreasi,
            <br />
            rawat rasa.
          </h1>

          <p className="mt-5 max-w-sm font-sans text-xs font-light leading-relaxed text-brand-bg/70">
            Ruang kerja privat untuk merawat katalog, memantau koleksi, dan
            menjaga setiap detail Cristin Luscious tetap rapi.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between font-sans text-[9px] font-semibold uppercase tracking-[0.28em] text-brand-bg/40">
          <span>Cristin Luscious</span>
          <span>Wonosobo</span>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex items-center justify-center px-6 py-14 sm:px-10">
        <Link
          href="/"
          className="absolute left-6 top-6 inline-flex items-center gap-2 font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-text transition-colors hover:text-brand-dark sm:left-10 sm:top-8"
        >
          <ArrowLeft size={13} />
          Website
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Image
              src="/logo.png"
              alt="Cristin Luscious"
              width={400}
              height={120}
              className="h-12 w-auto"
              priority
            />
          </div>

          <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.4em] text-brand-text">
            Restricted Access
          </span>

          <h2 className="mt-2 font-playfair text-3xl font-bold uppercase tracking-tight text-brand-dark">
            Masuk ke Dashboard
          </h2>

          <p className="mt-3 font-sans text-xs font-light leading-relaxed text-brand-text">
            Gunakan akun admin yang sudah di-seed ke database. Tidak ada
            registrasi publik.
          </p>

          <div className="mt-8">
            <LoginForm callbackUrl={callbackUrl} />
          </div>

          <div className="mt-8 border-t border-brand-border pt-5"></div>
        </div>
      </section>
    </main>
  );
}
