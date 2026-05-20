"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-28 pb-16 lg:pb-0 overflow-hidden bg-black"
    >
      {/* Decorative premium background grid lines */}
      <div className="absolute inset-0 grid grid-cols-4 gap-0 pointer-events-none opacity-5">
        <div className="border-r border-white h-full" />
        <div className="border-r border-white h-full" />
        <div className="border-r border-white h-full" />
        <div className="h-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        {/* Left Side: Brand & Call to Action (Text Content) */}
        <div className="lg:col-span-7 flex flex-col space-y-6 lg:space-y-8 text-left animate-[fade-in-up_1.2s_ease-out]">
          <div className="space-y-2">
            {/* Signature Brand Flourish */}
            <span className="font-script text-3xl md:text-5xl text-zinc-300 font-light tracking-wide block">
              Welcome to the world of
            </span>
            {/* Main Brand Title */}
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.9] text-white">
              Cristin <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
                Luscious
              </span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="flex items-center space-x-4">
            <span className="h-[1px] w-12 bg-zinc-500 hidden sm:block" />
            <p className="font-sans text-xs sm:text-sm tracking-[0.3em] uppercase text-zinc-300 font-semibold">
              Luscious Cookies & Dessert
            </p>
          </div>

          {/* Description Paragraph */}
          <p className="max-w-lg font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed tracking-wide">
            Where high gastronomy meets visual poetry. Every creation is
            meticulously handcrafted, blending premium imported ingredients with
            refined artistic aesthetics to sculpt the ultimate dessert
            indulgence.
          </p>

          {/* Interactive CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <a
              href="#products"
              className="group px-8 py-4 bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-black hover:text-white border border-white hover:border-zinc-800 transition-all duration-500 flex items-center justify-center space-x-3 rounded-none"
            >
              <span>Explore Creations</span>
              <ArrowRight
                size={14}
                className="transform group-hover:translate-x-1.5 transition-transform duration-300"
              />
            </a>
            <a
              href="#signature"
              className="px-8 py-4 bg-transparent text-white font-semibold text-xs uppercase tracking-widest hover:bg-zinc-950 border border-zinc-800 hover:border-zinc-500 transition-all duration-500 flex items-center justify-center rounded-none"
            >
              The Signature
            </a>
          </div>
        </div>

        {/* Right Side: Hero Image Presentation */}
        <div className="lg:col-span-5 relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/5] animate-[fade-in-up_1.5s_ease-out_forwards]">
          {/* Luxury Frame Container */}
          <div className="absolute inset-0 border border-zinc-900 translate-x-4 translate-y-4 -z-10 transition-transform duration-700 hover:translate-x-2 hover:translate-y-2" />
          <div className="relative w-full h-full overflow-hidden border border-zinc-800 group bg-zinc-950">
            <Image
              src="/hero_cheesecake.png"
              alt="Cristin Luscious Signature Cheesecake"
              fill
              priority
              className="object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-105 filter grayscale contrast-110"
              sizes="(max-w-1024px) 100vw, 40vw"
            />
            {/* Visual overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

            {/* Elegant Floating Tag on Image */}
            <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/60 backdrop-blur-md border border-zinc-900 flex justify-between items-center">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-zinc-500">
                  Signature Masterwork
                </p>
                <p className="font-playfair text-lg text-white mt-1">
                  Artisan Cheesecake
                </p>
              </div>
              <span className="text-[10px] tracking-widest uppercase font-semibold px-2 py-1 bg-white text-black font-sans">
                Featured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Bottom Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 z-10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
        <a href="#about" className="flex flex-col items-center">
          <span className="text-[9px] tracking-[0.4em] uppercase text-zinc-500">
            Discover More
          </span>
          <ChevronDown
            size={14}
            className="text-zinc-500 mt-1 animate-bounce"
          />
        </a>
      </div>
    </section>
  );
}
