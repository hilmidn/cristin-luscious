"use client";

import Image from "next/image";
import { Check, Star } from "lucide-react";

export default function FeaturedCheesecake() {
  const highlights = [
    "Velvety cream cheese imported directly from Normandy",
    "Caramelized signature house-blend biscuit crust",
    "Slow-baked at low temperatures for 8 hours",
    "Zero artificial flavorings or preservatives",
    "Delicate, high-end organic vanilla bean infusion",
  ];

  return (
    <section
      id="signature"
      className="relative py-24 md:py-36 bg-brand-bg text-brand-dark overflow-hidden border-t border-brand-border"
    >
      {/* Background visual graphics */}
      <div className="absolute left-10 top-1/4 w-72 h-72 bg-brand-muted/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Image with Luxury Overlay */}
          <div
            className="lg:col-span-6 relative w-full aspect-square md:aspect-4/3 lg:aspect-square"
            data-aos="fade-right"
          >
            <div className="absolute inset-0 border border-brand-border -translate-x-4 -translate-y-4 -z-10" />
            <div className="relative w-full h-full overflow-hidden border border-brand-border group bg-brand-card">
              <Image
                src="/photos/featured_product_cheesecake.jpeg"
                alt="Gourmet Artisan Cheesecake Slice"
                fill
                className="object-cover object-[center_30%] transition-transform duration-[2.5s] ease-out group-hover:scale-105 filter contrast-110"
                sizes="(max-w-1024px) 100vw, 45vw"
              />
              <div className="absolute inset-0 bg-linear-to-tr from-brand-dark/20 via-transparent to-transparent opacity-45" />

              {/* Badge */}
              <div className="absolute top-6 left-6 px-4 py-2 bg-brand-dark text-brand-bg border border-brand-dark flex items-center space-x-2">
                <Star size={12} fill="currentColor" />
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase font-sans">
                  Masterpiece
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Product Merits */}
          <div
            className="lg:col-span-6 flex flex-col space-y-6 lg:space-y-8"
            data-aos="fade-left"
          >
            <div>
              <span className="text-xs font-semibold tracking-[0.4em] uppercase text-brand-text block mb-3">
                Our Legendary Masterwork
              </span>
              <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-brand-dark leading-none">
                The Signature <br />
                <span className="font-script text-3xl md:text-5xl text-brand-text font-light tracking-wide block lowercase mt-2">
                  cheesecake
                </span>
              </h2>
              <div className="w-16 h-px bg-brand-border mt-6" />
            </div>

            <p className="font-sans text-sm md:text-base text-brand-text font-light leading-relaxed tracking-wide">
              The crown jewel of Cristin&lsquo;s Luscious. Our signature
              cheesecake is a love letter to gourmet gastronomy. Combining pure
              decadence with sculptural elegance, we have engineered a recipe
              that strikes the absolute golden ratio between dense, velvet cream
              and a crisp, caramelized buttery crumb foundation.
            </p>

            {/* Merits Checklist */}
            <div className="space-y-3">
              {highlights.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3"
                  data-aos="fade-up"
                  data-aos-delay={index * 80}
                >
                  <div className="mt-1 flex items-center justify-center w-4 h-4 rounded-full border border-brand-text/40">
                    <Check size={10} className="text-brand-dark" />
                  </div>
                  <span className="font-sans text-xs md:text-sm text-brand-text font-light tracking-wide">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Call to action & price note */}
            <div
              className="pt-6 border-t border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div>
                <p className="text-[10px] tracking-widest uppercase text-brand-text">
                  Starting From
                </p>
                <p className="font-playfair text-2xl md:text-3xl font-bold text-brand-dark mt-1">
                  IDR 35.000
                </p>
              </div>
              <a
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 bg-brand-dark text-brand-bg font-semibold text-xs uppercase tracking-widest hover:bg-white hover:text-brand-dark border border-brand-dark hover:border-brand-text transition-all duration-500 text-center rounded-none"
              >
                Order Signature
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
