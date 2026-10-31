"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

type LoginFormProps = {
  callbackUrl?: string;
};

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const safeCallbackUrl =
    callbackUrl?.startsWith("/admin") ? callbackUrl : "/admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result || result.error) {
        setError("Email atau password salah. Silakan coba lagi.");
        setPassword("");
        return;
      }

      router.replace(safeCallbackUrl);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@cristinluscious.com"
          className="w-full border border-brand-border bg-brand-bg px-4 py-3 font-sans text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-muted focus:border-brand-dark"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full border border-brand-border bg-brand-bg px-4 py-3 pr-11 font-sans text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-muted focus:border-brand-dark"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-brand-text transition-colors hover:text-brand-dark"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-brand-dark/20 bg-brand-card px-4 py-3"
        >
          <AlertCircle
            size={14}
            strokeWidth={1.6}
            className="mt-0.5 shrink-0 text-brand-dark"
          />
          <p className="font-sans text-[11px] leading-relaxed text-brand-dark">
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 border border-brand-dark bg-brand-dark px-6 py-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-bg transition-colors duration-300 hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Memproses
          </>
        ) : (
          <>
            Masuk
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
