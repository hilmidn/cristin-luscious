import type { Metadata } from "next";
import { Playfair_Display, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
});

export const metadata: Metadata = {
  title: "Cristin Luscious | Premium Cookies & Dessert",
  description: "Experience the premium elegance of Cristin Luscious. Discover our signature artisan cheesecake, handcrafted cookies, gourmet donuts, customized cakes, and decadent brownies in a luxurious monochrome experience.",
  keywords: "Cristin Luscious, Cheesecake, Cookies, Dessert, Premium Bakery, Custom Cake, Brownies, Gourmet Donut",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${greatVibes.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full bg-zinc-950 text-white font-sans selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}

