"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  features: string[];
}

export default function ProductList() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const products: ProductItem[] = [
    {
      id: "cookies",
      name: "Handcrafted Cookies",
      tagline: "Crisp Edges, Chewy Core",
      description:
        "Handcrafted in small batches using premium single-origin Belgian chocolate, organic butter, and sea salt flakes. Perfectly balanced flavors that redefine the classic cookie.",
      image: "/product_cookies.png",
      features: ["Belgian Dark Chocolate", "Fleur de Sel topping", "Baked Daily"],
    },
    {
      id: "donut",
      name: "Gourmet Donuts",
      tagline: "Fluffy & Silky Glazes",
      description:
        "Brioche-style gourmet donuts that undergo a slow 24-hour fermentation. Topped with artisan handcrafted glazes, custom ganaches, and elegant, minimalist garnishes.",
      image: "/product_donut.png",
      features: ["Slow Fermented Brioche", "Artisan Ganache", "Light & Fluffy"],
    },
    {
      id: "cheesecake",
      name: "Signature Cheesecake",
      tagline: "Velvety Elegance",
      description:
        "Our legendary slow-baked masterpiece. An ultra-velvety cream cheese filling resting beautifully upon a crumbly, caramelized house biscuit base.",
      image: "/product_cheesecake.png",
      features: ["Normandy Cream Cheese", "Slow baked 8h", "Caramelized Crust"],
    },
    {
      id: "custom-cake",
      name: "Custom Designs",
      tagline: "Tailored Luxury Sculptures",
      description:
        "Bespoke, multi-tiered cake sculptures designed exclusively for your grand celebrations. We translate your artistic visions into delicious, structurally stunning realities.",
      image: "/product_custom_cake.png",
      features: ["Bespoke Visual Concept", "Luxury Structural Design", "Premium Flavor Blends"],
    },
    {
      id: "brownies",
      name: "Decadent Brownies",
      tagline: "Intense Cocoa Sensation",
      description:
        "Fudgy, dense, and incredibly rich brownies made from 70% dark cocoa. Dusted lightly with dark Dutch cocoa, offering an intense melt-in-your-mouth chocolate sensation.",
      image: "/product_brownies.png",
      features: ["70% Single-Origin Cocoa", "Fudgy Chocolate Core", "Premium Cocoa Dusting"],
    },
  ];

  return (
    <section
      id="products"
      className="relative py-24 md:py-36 bg-zinc-950 text-white overflow-hidden border-t border-zinc-900"
    >
      {/* Decorative vertical lines and accents */}
      <div className="absolute left-0 top-0 w-1/4 h-full border-r border-zinc-900/40 pointer-events-none" />
      <div className="absolute right-0 top-0 w-1/4 h-full border-l border-zinc-900/40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-6" data-aos="fade-up">
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-[0.4em] uppercase text-zinc-500 block mb-3">
              The Collection
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white leading-none">
              Artisan <br />
              <span className="font-script text-3xl md:text-5xl text-zinc-300 font-light tracking-wide block lowercase mt-2">
                creations
              </span>
            </h2>
          </div>
          <div>
            <p className="max-w-sm font-sans text-xs md:text-sm text-zinc-400 font-light leading-relaxed tracking-wide">
              An elegant curation of fine patisserie categories, handcrafted daily to deliver unmatched luxury and aesthetic charm.
            </p>
          </div>
        </div>

        {/* Product Grid - Premium Editorial Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {products.map((product, index) => {
            const isHovered = hoveredIndex === index;
            // Make some cards span 2 columns on larger screens to break the monotony
            const isFeatured = index === 0 || index === 3;
            
            return (
              <div
                key={product.id}
                className={`group relative flex flex-col justify-between border border-zinc-900 bg-black/60 p-6 md:p-8 transition-all duration-500 ease-in-out hover:border-zinc-700 hover:bg-black ${
                  isFeatured ? "md:col-span-1 lg:col-span-1" : ""
                }`}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                
                {/* Image Container with strict monochrome styling */}
                <div className="relative w-full aspect-square overflow-hidden border border-zinc-900 mb-6 bg-zinc-950">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 filter grayscale contrast-115"
                    sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-100 group-hover:opacity-20 transition-opacity duration-500" />
                  
                  {/* Premium floating serial label */}
                  <span className="absolute top-4 left-4 text-[9px] tracking-widest font-mono text-zinc-400 bg-black/80 px-2.5 py-1 border border-zinc-900">
                    COL-0{index + 1}
                  </span>
                </div>

                {/* Text Content */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans block mb-1">
                      {product.tagline}
                    </span>
                    <h3 className="font-playfair text-xl md:text-2xl text-white font-bold tracking-wide">
                      {product.name}
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-zinc-400 font-light leading-relaxed mt-3">
                      {product.description}
                    </p>
                  </div>

                  {/* Highlights Bullet Tags */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-900/60">
                    {product.features.map((feature, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[9px] font-semibold tracking-wider uppercase bg-zinc-950 text-zinc-400 px-2.5 py-1 border border-zinc-900"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 flex justify-between items-center text-xs tracking-widest uppercase font-semibold text-white group-hover:text-zinc-300 transition-colors">
                    <span>Order Category</span>
                    <a
                      href="#contact"
                      className="w-8 h-8 rounded-full border border-zinc-900 group-hover:border-white/40 flex items-center justify-center transition-colors duration-500"
                    >
                      <ArrowUpRight size={14} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
