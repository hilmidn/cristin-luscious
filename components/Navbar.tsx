"use client";

import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Our Story", href: "#about" },
    { name: "Signature", href: "#signature" },
    { name: "Creations", href: "#products" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-zinc-900/60 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo - Huruf Latin script aesthetic */}
        <a href="#home" className="flex flex-col group relative">
          <span className="font-playfair text-xl md:text-2xl font-bold tracking-widest text-white group-hover:text-zinc-300 transition-colors uppercase">
            Cristin
          </span>
          <span className="font-script text-2xl md:text-3xl text-zinc-300 font-light -mt-2.5 ml-4 tracking-wider group-hover:text-white transition-colors duration-500">
            Luscious
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs tracking-widest uppercase text-zinc-400 hover:text-white transition-all duration-300 relative group py-2"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <a
            href="#contact"
            className="px-6 py-2 border border-white text-xs font-semibold uppercase tracking-widest text-black bg-white hover:bg-black hover:text-white hover:border-zinc-800 transition-all duration-500 rounded-none"
          >
            Order Now
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none p-1.5 border border-transparent hover:border-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed inset-0 top-[73px] bg-black/98 z-40 flex flex-col justify-center px-8 space-y-8 transition-all duration-500 ease-in-out ${
          isMobileMenuOpen
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 -translate-y-4 invisible pointer-events-none"
        }`}
      >
        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-xl tracking-widest uppercase font-playfair text-zinc-300 hover:text-white transition-colors block border-b border-zinc-900 pb-3"
          >
            {link.name}
          </a>
        ))}
        <a
          href="#contact"
          onClick={() => setIsMobileMenuOpen(false)}
          className="w-full text-center px-6 py-4 border border-white text-xs font-semibold uppercase tracking-widest text-black bg-white hover:bg-transparent hover:text-white transition-all duration-500"
        >
          Order Now
        </a>
      </div>
    </nav>
  );
}
