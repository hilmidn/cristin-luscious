"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Our Story", href: "#about" },
    { name: "Signature", href: "#signature" },
    { name: "Creations", href: "#products" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out ${
          isScrolled
            ? "bg-black/90 backdrop-blur-xl border-b border-zinc-900/60 py-4"
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
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-white focus:outline-none p-1.5 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Bulletproof Fullscreen Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed inset-0 bg-black z-50 flex flex-col justify-between p-6 transition-all duration-500 ease-in-out ${
          isMobileMenuOpen
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 -translate-y-4 invisible pointer-events-none"
        }`}
      >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-playfair text-xl font-bold tracking-widest text-white uppercase">
              Cristin
            </span>
            <span className="font-script text-2xl text-zinc-300 font-light -mt-2.5 ml-4 tracking-wider">
              Luscious
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white focus:outline-none p-1.5 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links Middle Container */}
        <div className="flex flex-col space-y-6 my-auto text-left pl-4">
          <span className="text-[9px] tracking-[0.4em] uppercase text-zinc-600 font-bold font-sans">
            Menu Navigation
          </span>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-3xl tracking-widest uppercase font-playfair text-zinc-300 hover:text-white transition-colors block py-1.5"
            >
              {link.name}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-6 w-full text-center px-6 py-4 border border-white text-xs font-semibold uppercase tracking-widest text-black bg-white hover:bg-transparent hover:text-white transition-all duration-500"
          >
            Order Now
          </a>
        </div>

        {/* Footer info inside drawer */}
        <div className="border-t border-zinc-900 pt-6 space-y-4 text-left">
          <p className="font-sans text-[10px] tracking-widest uppercase text-zinc-500 font-bold">
            Luscious Cookies & Dessert
          </p>
          <div className="flex items-center space-x-3 text-zinc-400 text-xs">
            <Phone size={14} className="text-white" />
            <span>WA: +62 812-3456-7890</span>
          </div>
          <div className="flex space-x-4 pt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-8 h-8 border border-zinc-900 text-zinc-400 hover:text-white transition-colors rounded-none bg-zinc-950"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
