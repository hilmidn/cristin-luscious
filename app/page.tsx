import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FeaturedCheesecake from "@/components/FeaturedCheesecake";
import ProductList from "@/components/ProductList";
import Footer from "@/components/Footer";
import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;

const TITLE = "Cheesecake Premium Wonosobo | Cristins Luscious";

const DESKRIPSI_PERUSAHAAN =
  "Nikmati cheesecake premium, custom cake, brownies, dan dessert terbaik di Wonosobo hanya di Cristins Luscious. Homemade, elegan, dan cocok untuk hadiah maupun acara spesial.";
const getAbsoluteUrl = (path = "/") => {
  if (!siteUrl) return undefined;
  return new URL(path, siteUrl).toString();
};

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = getAbsoluteUrl("/");
  const ogImage = getAbsoluteUrl("/featured_brand.png");

  return {
    title: TITLE,
    description: DESKRIPSI_PERUSAHAAN,
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: canonicalUrl,
      title: TITLE,
      description: DESKRIPSI_PERUSAHAAN,
      siteName: TITLE,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: TITLE,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESKRIPSI_PERUSAHAAN,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function Home() {
  const canonicalUrl = getAbsoluteUrl("/");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": canonicalUrl ? `${canonicalUrl}#website` : undefined,
        url: canonicalUrl,
        name: TITLE,
        description: DESKRIPSI_PERUSAHAAN,
        inLanguage: "id-ID",
      },
      {
        "@type": "Organization",
        "@id": canonicalUrl ? `${canonicalUrl}#organization` : undefined,
        name: TITLE,
        url: canonicalUrl,
        description: DESKRIPSI_PERUSAHAAN,
        logo: getAbsoluteUrl("/featured_brand.png"),
        email: "cristins.luscious@gmail.com",
        telephone: "+6289688264931",
        address:
          "Mlipak RT3/RW4, Kelurahan Mlipak, Kecamatan Wonosobo, Kabupaten Wonosobo, Jawa Tengah",
        sameAs: ["https://instagram.com/cristins.luscious"],
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
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
    </>
  );
}
