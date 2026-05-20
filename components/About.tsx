"use client";

import { Sparkles, Award, ShieldCheck } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: (
        <Sparkles
          size={22}
          className="text-brand-dark group-hover:text-brand-bg duration-500 ease-in-out"
        />
      ),
      title: "Artisanal Mastery",
      description:
        "Every cookie and cake is sculpted by hand with absolute precision, honoring traditional high-pastry techniques with a contemporary visionary twist.",
    },
    {
      icon: (
        <Award
          size={22}
          className="text-brand-dark group-hover:text-brand-bg duration-500 ease-in-out"
        />
      ),
      title: "Elite Ingredients",
      description:
        "We source only the rarest premium chocolates, organic dairy, and fresh components globally to deliver unparalleled deep flavor profiles.",
    },
    {
      icon: (
        <ShieldCheck
          size={22}
          className="text-brand-dark group-hover:text-brand-bg duration-500 ease-in-out"
        />
      ),
      title: "Uncompromising Quality",
      description:
        "Perfect crusts, silky fillings, and balanced sweetness. We don't just bake; we design edible masterpieces designed to leave an everlasting impression.",
    },
  ];

  return (
    <section
      id="about"
      className="relative py-24 md:py-36 bg-brand-bg text-brand-dark overflow-hidden border-t border-brand-border"
    >
      {/* Decorative vertical lines and absolute items */}
      <div className="absolute right-0 top-0 w-1/3 h-full border-l border-brand-border/40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Editorial Section Header */}
        <div className="max-w-3xl mb-16 md:mb-24" data-aos="fade-up">
          <span className="text-xs font-semibold tracking-[0.4em] uppercase text-brand-text block mb-3">
            Our Legacy
          </span>
          <h2 className="font-playfair text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight leading-tight">
            Crafting edible art with absolute devotion & aesthetic grace.
          </h2>
          <div className="w-20 h-px bg-brand-dark mt-8" />
        </div>

        {/* Story Block: Large Cursive Quote & Editorial Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Cursive Brand Narrative quote */}
          <div
            className="lg:col-span-5 p-8 md:p-12 bg-brand-card border border-brand-border relative"
            data-aos="fade-right"
          >
            <span className="absolute top-4 left-4 font-playfair text-6xl text-brand-muted leading-none pointer-events-none">
              “
            </span>
            <p className="font-script text-3xl md:text-4xl lg:text-5xl text-brand-text leading-relaxed pt-6">
              Baking is not just a recipe; it is an intimate expression of
              luxury, design, and unforgettable sensation.
            </p>
            <div className="mt-8 flex justify-end">
              <span className="font-sans text-[10px] tracking-widest uppercase text-brand-text font-semibold">
                — Cristin, Head Chef & Founder
              </span>
            </div>
          </div>

          {/* Right Column: Detailed narrative */}
          <div
            className="lg:col-span-7 flex flex-col justify-between h-full space-y-6 md:space-y-8"
            data-aos="fade-left"
          >
            <h3 className="font-playfair text-xl md:text-2xl text-brand-dark font-medium">
              The Genesis of Cristin Luscious
            </h3>

            <p className="font-sans text-sm md:text-base text-brand-text font-light leading-relaxed tracking-wide">
              Founded on the belief that desserts should be a multisensory
              experience, Cristin Luscious began as a boutique studio dedicated
              to pushing the boundaries of classic baking. Our hallmark is a
              sophisticated monochrome visual philosophy, allowing the rich
              textures, exquisite geometries, and deep flavor notes of our
              creations to take absolute center stage.
            </p>

            <p className="font-sans text-sm md:text-base text-brand-text font-light leading-relaxed tracking-wide">
              From our crispy-edge artisan cookies to our legendary velvety
              signature cheesecake, every item in our menu is a celebration of
              taste and culinary elegance. We reject mass production in favor of
              small-batch perfection, ensuring that every box delivered is an
              experience of supreme luxury.
            </p>

            {/* Micro Stats counters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-brand-border">
              <div>
                <p className="font-playfair text-3xl md:text-4xl font-bold text-brand-dark">
                  100%
                </p>
                <p className="text-[10px] tracking-widest uppercase text-brand-text mt-1">
                  Artisan Handcrafted
                </p>
              </div>
              <div>
                <p className="font-playfair text-3xl md:text-4xl font-bold text-brand-dark">
                  Zero
                </p>
                <p className="text-[10px] tracking-widest uppercase text-brand-text mt-1">
                  Compromise on Taste
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="font-playfair text-3xl md:text-4xl font-bold text-brand-dark">
                  Premium
                </p>
                <p className="text-[10px] tracking-widest uppercase text-brand-text mt-1">
                  Imported Ingredients
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 md:mt-32">
          {values.map((value, idx) => (
            <div
              key={idx}
              className="p-8 bg-brand-card border border-brand-border hover:border-brand-text transition-all duration-500 ease-in-out group"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
            >
              <div className="w-12 h-12 bg-brand-muted border border-brand-border flex items-center justify-center mb-6 group-hover:bg-brand-dark group-hover:text-brand-bg group-hover:border-brand-dark transition-colors duration-500">
                <div className="transition-all duration-500">{value.icon}</div>
              </div>
              <h4 className="font-playfair text-lg text-brand-dark font-semibold mb-3 tracking-wide">
                {value.title}
              </h4>
              <p className="font-sans text-xs md:text-sm text-brand-text font-light leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
