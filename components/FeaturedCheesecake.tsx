"use client";

import React from "react";
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
      className="relative py-24 md:py-36 bg-black text-white overflow-hidden border-t border-zinc-900"
    >
      {/* Background visual graphics */}
      <div className="absolute left-10 top-1/4 w-72 h-72 bg-zinc-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Image with Luxury Overlay */}
          <div className="lg:col-span-6 relative w-full aspect-square md:aspect-[4/3] lg:aspect-square">
            <div className="absolute inset-0 border border-zinc-900 -translate-x-4 -translate-y-4 -z-10" />
            <div className="relative w-full h-full overflow-hidden border border-zinc-800 group bg-zinc-950">
              <Image
                src="/product_cheesecake.png"
                alt="Gourmet Artisan Cheesecake Slice"
                fill
                className="object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-105 filter grayscale contrast-110"
                sizes="(max-w-1024px) 100vw, 45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent opacity-45" />
              
              {/* Badge */}
              <div className="absolute top-6 left-6 px-4 py-2 bg-white text-black border border-white flex items-center space-x-2">
                <Star size={12} fill="black" />
                <span className="text-[9px] font-bold tracking-[0.3em] uppercase font-sans">Masterpiece</span>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Product Merits */}
          <div className="lg:col-span-6 flex flex-col space-y-6 lg:space-y-8">
            <div>
              <span className="text-xs font-semibold tracking-[0.4em] uppercase text-zinc-500 block mb-3">
                Our Legendary Masterwork
              </span>
              <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white leading-none">
                The Signature <br />
                <span className="font-script text-3xl md:text-5xl text-zinc-300 font-light tracking-wide block lowercase mt-2">
                  cheesecake
                </span>
              </h2>
              <div className="w-16 h-[1px] bg-zinc-700 mt-6" />
            </div>

            <p className="font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed tracking-wide">
              The crown jewel of Cristin Luscious. Our signature cheesecake is a love letter to gourmet gastronomy. Combining pure decadence with sculptural elegance, we have engineered a recipe that strikes the absolute golden ratio between dense, velvet cream and a crisp, caramelized buttery crumb foundation.
            </p>

            {/* Merits Checklist */}
            <div className="space-y-3">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="mt-1 flex items-center justify-center w-4 h-4 rounded-full border border-white/40">
                    <Check size={10} className="text-white" />
                  </div>
                  <span className="font-sans text-xs md:text-sm text-zinc-300 font-light tracking-wide">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Call to action & price note */}
            <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-zinc-500">Starting From</p>
                <p className="font-playfair text-2xl md:text-3xl font-bold text-white mt-1">IDR 350.000</p>
              </div>
              <a
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-black hover:text-white border border-white hover:border-zinc-800 transition-all duration-500 text-center rounded-none"
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
