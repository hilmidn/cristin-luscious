"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Award } from "lucide-react";

export default function Footer() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <footer
      id="contact"
      className="relative pt-24 pb-12 bg-black text-white overflow-hidden border-t border-zinc-900"
    >
      {/* Decorative vertical coordinates grid */}
      <div className="absolute inset-0 grid grid-cols-4 gap-0 pointer-events-none opacity-5">
        <div className="border-r border-white h-full" />
        <div className="border-r border-white h-full" />
        <div className="border-r border-white h-full" />
        <div className="h-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Contact Split Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-20 border-b border-zinc-900">
          
          {/* Left Column: Brand, Contact Info, Map, Hours */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-10">
            <div>
              {/* Cursive Brand Logo */}
              <a href="#home" className="flex flex-col group relative max-w-max">
                <span className="font-playfair text-2xl md:text-3xl font-bold tracking-widest text-white uppercase">
                  Cristin
                </span>
                <span className="font-script text-3xl md:text-4xl text-zinc-300 font-light -mt-3.5 ml-6 tracking-wider">
                  Luscious
                </span>
              </a>
              <p className="font-sans text-xs tracking-[0.25em] uppercase text-zinc-500 font-bold mt-2">
                Luscious Cookies & Dessert
              </p>
            </div>

            {/* Direct Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-zinc-400">
                  <MapPin size={18} className="text-white shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-zinc-300">
                    Boutique Atelier
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-zinc-400 font-light leading-relaxed">
                  Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan, 12190
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-zinc-400">
                  <Clock size={18} className="text-white shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-zinc-300">
                    Atelier Hours
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-zinc-400 font-light leading-relaxed">
                  Monday — Sunday<br />09:00 AM — 09:00 PM
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-zinc-400">
                  <Phone size={18} className="text-white shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-zinc-300">
                    Inquiries & Orders
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-zinc-400 font-light leading-relaxed">
                  WhatsApp: +62 812-3456-7890<br />Tel: +62 21-555-7890
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-zinc-400">
                  <Mail size={18} className="text-white shrink-0" />
                  <span className="font-sans text-xs tracking-wider uppercase font-semibold text-zinc-300">
                    Bespoke Inquiries
                  </span>
                </div>
                <p className="font-sans text-xs md:text-sm text-zinc-400 font-light leading-relaxed">
                  hello@cristinluscious.com<br />concierge@cristinluscious.com
                </p>
              </div>
            </div>

            {/* Social Icons & Signature Award */}
            <div className="flex flex-wrap items-center gap-6 pt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-10 h-10 border border-zinc-900 hover:border-white transition-colors duration-500 rounded-none bg-zinc-950"
              >
                <svg
                  className="w-4 h-4 text-white"
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
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-10 h-10 border border-zinc-900 hover:border-white transition-colors duration-500 rounded-none bg-zinc-950"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <div className="flex items-center space-x-3 ml-auto text-zinc-500 border-l border-zinc-950 pl-6 hidden sm:flex">
                <Award size={18} className="text-zinc-400" />
                <span className="font-sans text-[10px] tracking-widest uppercase font-semibold">
                  Handcrafted with Pride
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Message Form */}
          <div className="lg:col-span-6 border border-zinc-900 p-8 md:p-10 bg-black/60 backdrop-blur-md">
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-zinc-500 block mb-2 font-sans">
              Connect With Us
            </span>
            <h3 className="font-playfair text-xl md:text-2xl text-white font-medium mb-6">
              Inquire or Reserve an Order
            </h3>

            {isSubmitted ? (
              <div className="p-6 bg-white text-black border border-white space-y-3">
                <p className="font-playfair text-lg font-bold">Inquiry Sent Successfully</p>
                <p className="font-sans text-xs font-light leading-relaxed">
                  Thank you for contacting Cristin Luscious. Our culinary concierge will reach out to you via email or phone within the next 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-2 font-sans">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full bg-zinc-950 border border-zinc-900 focus:border-white text-white text-xs px-4 py-3 rounded-none focus:outline-none transition-colors font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-2 font-sans">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="w-full bg-zinc-950 border border-zinc-900 focus:border-white text-white text-xs px-4 py-3 rounded-none focus:outline-none transition-colors font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-zinc-500 font-semibold mb-2 font-sans">
                    Your Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Describe your dessert request, custom cake details, or order preferences..."
                    className="w-full bg-zinc-950 border border-zinc-900 focus:border-white text-white text-xs px-4 py-3 rounded-none focus:outline-none transition-colors resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-black hover:text-white border border-white hover:border-zinc-800 transition-all duration-500 flex items-center justify-center space-x-3 rounded-none cursor-pointer"
                >
                  <span>Submit Inquiry</span>
                  <Send size={12} />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Bottom copyright details */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] tracking-widest uppercase text-zinc-600 gap-4">
          <p>© {new Date().getFullYear()} Cristin Luscious. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <a href="#about" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#products" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
