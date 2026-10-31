"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { isAllowedImagePath } from "@/lib/catalog-types";

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
};

export default function ImageUploader({
  value,
  onChange,
  label = "Gambar",
  hint = "JPG, PNG, atau WebP — maksimal 4MB.",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { startUpload, isUploading } = useUploadThing("productImage", {
    uploadProgressGranularity: "fine",
    onUploadProgress: (value) => setProgress(value),
    onClientUploadComplete: (files) => {
      const file = files[0];
      if (file?.ufsUrl) {
        onChange(file.ufsUrl);
      }
      setProgress(0);
    },
    onUploadError: (uploadError) => {
      setError(uploadError.message);
      setProgress(0);
    },
  });

  async function upload(file?: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }

    setError(null);
    await startUpload([file]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-text transition-colors hover:text-brand-dark"
          >
            <Trash2 size={11} />
            Hapus
          </button>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void upload(event.dataTransfer.files?.[0]);
        }}
        className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border transition-colors ${
          isDragging
            ? "border-brand-dark bg-brand-card"
            : "border-brand-border bg-brand-card"
        }`}
      >
        {value && isAllowedImagePath(value) ? (
          <>
            <Image
              src={value}
              alt="Pratinjau gambar"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
            />
            <div className="absolute inset-0 bg-brand-dark/0 transition-colors hover:bg-brand-dark/20" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-3 right-3 inline-flex items-center gap-2 border border-brand-dark bg-brand-bg px-3 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-dark transition-colors hover:bg-brand-dark hover:text-brand-bg disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ImagePlus size={12} />
              )}
              Ganti
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center transition-colors hover:bg-brand-bg/60 disabled:cursor-wait"
          >
            {isUploading ? (
              <Loader2 size={22} className="animate-spin text-brand-text" />
            ) : (
              <ImagePlus size={22} strokeWidth={1.3} className="text-brand-text" />
            )}
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">
              {isUploading ? "Mengunggah..." : "Pilih atau tarik gambar"}
            </span>
            <span className="max-w-[240px] font-sans text-[9px] leading-relaxed text-brand-text">
              {hint}
            </span>
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-border">
            <div
              className="h-full bg-brand-dark transition-[width] duration-200"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="mt-3">
        <label className="mb-1.5 block font-sans text-[8px] font-bold uppercase tracking-[0.22em] text-brand-text">
          Path / URL gambar
        </label>
        <input
          value={value}
          onChange={(event) => {
            setError(null);
            onChange(event.target.value);
          }}
          placeholder="/product_cookies.png atau https://...ufs.sh/..."
          className="w-full border border-brand-border bg-brand-bg px-3 py-2 font-mono text-[9px] text-brand-dark outline-none transition-colors placeholder:text-brand-muted focus:border-brand-dark"
        />
        <p className="mt-1.5 font-sans text-[8px] leading-relaxed text-brand-muted">
          Bisa memakai path lokal di folder public atau URL UploadThing.
        </p>
      </div>

      {error && (
        <p className="mt-2 border border-brand-dark/20 bg-brand-card px-3 py-2 font-sans text-[10px] leading-relaxed text-brand-dark">
          {error}
        </p>
      )}
    </div>
  );
}
