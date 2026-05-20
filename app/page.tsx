import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FeaturedCheesecake from "@/components/FeaturedCheesecake";
import ProductList from "@/components/ProductList";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Floating elegant header */}
      <Navbar />

      <main>
        {/* Core dynamic entry presentation */}
        <Hero />

        {/* Brand legacy and story values */}
        <About />

        {/* Featured star cheesecake product showcase */}
        <FeaturedCheesecake />

        {/* Elegant collection list (Cookies, Donut, Cheesecake, Custom Cake, Brownies) */}
        <ProductList />
      </main>

      {/* Structured contact form & business coordinates */}
      <Footer />
    </div>
  );
}
