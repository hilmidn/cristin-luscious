"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Award } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: "", email: "", message: "" });
      }, 5000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <footer
      id="contact"
      className="relative pt-24 pb-12 bg-brand-bg text-brand-dark overflow-hidden border-t border-brand-border"
    >
      {/* Decorative vertical coordinates grid */}
      <div className="absolute inset-0 grid grid-cols-4 gap-0 pointer-events-none opacity-5">
        <div className="border-r border-brand-border h-full" />
        <div className="border-r border-brand-border h-full" />
        <div className="border-r border-brand-border h-full" />
        <div className="h-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Contact Split Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-20 border-b border-brand-border">
          {/* Left Column: Brand, Contact Info, Map, Hours */}
          <div
            className="lg:col-span-6 flex flex-col justify-between space-y-10"
            data-aos="fade-right"
          >
            <div>
              {/* Cursive Brand Logo */}
              <a
                href="#home"
                className="flex flex-col group relative max-w-max"
              >
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={400}
                  height={120}
                  className="h-14 w-auto"
                  loading="eager"
                />
              </a>
              <p className="font-sans text-xs tracking-[0.25em] uppercase text-brand-text font-bold mt-2">
                Luscious Cookies & Dessert
              </p>
            </div>

            {/* Direct Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-brand-text">
                  <MapPin size={18} className="text-brand-dark shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-brand-text">
                    Boutique Atelier
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-brand-text font-light leading-relaxed">
                  Mlipak RT3/RW4, Kelurahan Mlipak, Kecamatan Wonosobo,
                  Kabupaten Wonosobo, Jawa Tengah
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-brand-text">
                  <Clock size={18} className="text-brand-dark shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-brand-text">
                    Atelier Hours
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-brand-text font-light leading-relaxed">
                  Monday — Sunday
                  <br />
                  09:00 AM — 09:00 PM
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-brand-text">
                  <Phone size={18} className="text-brand-dark shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-brand-text">
                    Inquiries & Orders
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-brand-text font-light leading-relaxed">
                  WhatsApp: +62 896-8826-4931
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-brand-text">
                  <Mail size={18} className="text-brand-dark shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-brand-text">
                    Bespoke Inquiries
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-brand-text font-light leading-relaxed">
                  cristinluscious@gmail.com
                </p>
              </div>
            </div>

            {/* Social Icons & Signature Award */}
            <div className="flex flex-wrap items-center gap-6 pt-6">
              <a
                href="https://instagram.com/cristins.luscious"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-10 h-10 border border-brand-border hover:border-brand-text transition-colors duration-500 rounded-none bg-brand-card"
              >
                <svg
                  className="w-4 h-4 text-brand-dark"
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
              <div className="flex items-center space-x-3 ml-auto text-brand-text border-l border-brand-border/40 pl-6 sm:flex">
                <Award size={18} className="text-brand-text" />
                <span className="font-sans text-[10px] tracking-widest uppercase font-semibold">
                  Handcrafted with Pride
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Message Form */}
          <div
            className="lg:col-span-6 border border-brand-border p-8 md:p-10 bg-brand-card backdrop-blur-md"
            data-aos="fade-left"
          >
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-brand-text block mb-2 font-sans">
              Connect With Us
            </span>
            <h3 className="font-playfair text-xl md:text-2xl text-brand-dark font-medium mb-6">
              Inquire or Reserve an Order
            </h3>

            {isSubmitted ? (
              <div className="p-6 bg-brand-dark text-brand-bg border border-brand-dark space-y-3">
                <p className="font-playfair text-lg font-bold">
                  Inquiry Sent Successfully
                </p>
                <p className="font-sans text-xs font-light leading-relaxed">
                  Thank you for contacting Cristin Luscious. Our culinary
                  concierge will reach out to you via email or phone within the
                  next 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-brand-text font-semibold mb-2 font-sans">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-dark text-brand-dark text-xs px-4 py-3 rounded-none focus:outline-none transition-colors font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-brand-text font-semibold mb-2 font-sans">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-dark text-brand-dark text-xs px-4 py-3 rounded-none focus:outline-none transition-colors font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-brand-text font-semibold mb-2 font-sans">
                    Your Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Describe your dessert request, custom cake details, or order preferences..."
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-dark text-brand-dark text-xs px-4 py-3 rounded-none focus:outline-none transition-colors resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-brand-dark text-brand-bg font-semibold text-xs uppercase tracking-widest hover:bg-white hover:text-brand-dark border border-brand-dark hover:border-brand-text transition-all duration-500 flex items-center justify-center space-x-3 rounded-none cursor-pointer"
                >
                  <span>Submit Inquiry</span>
                  <Send size={12} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright details */}
        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] tracking-widest uppercase text-brand-text gap-4"
          data-aos="fade-up"
        >
          <p>
            © {new Date().getFullYear()} Cristin Luscious. All Rights Reserved.
          </p>
          <div className="flex space-x-6">
            <a
              href="#about"
              className="hover:text-brand-dark transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#products"
              className="hover:text-brand-dark transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
