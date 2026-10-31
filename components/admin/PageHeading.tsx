import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeading({
  eyebrow,
  title,
  accent,
  description,
  actions,
}: PageHeadingProps) {
  return (
    <div className="mb-10 flex flex-col gap-6 border-b border-brand-border pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.4em] text-brand-text">
          {eyebrow}
        </span>

        <h1 className="mt-2 font-playfair text-3xl font-bold uppercase tracking-tight text-brand-dark md:text-4xl">
          {title}
          {accent && (
            <span className="ml-3 font-script text-2xl font-light lowercase tracking-wide text-brand-text md:text-3xl">
              {accent}
            </span>
          )}
        </h1>

        {description && (
          <p className="mt-3 max-w-xl font-sans text-xs font-light leading-relaxed text-brand-text md:text-sm">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
