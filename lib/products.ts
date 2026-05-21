// Central product data — used by ProductList and Product Detail pages
export type ProductVariant = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  tags: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  features: string[];
  hasVariants: boolean;
  variants?: ProductVariant[];
  // For custom cake (no variants, just order flow)
  customNote?: string;
};

export const products: Product[] = [
  {
    id: "cookies",
    slug: "cookies",
    name: "Handcrafted Cookies",
    tagline: "Crisp Edges, Chewy Core",
    description:
      "Dibuat secara artisan dalam jumlah terbatas setiap harinya. Setiap keping cookies Cristin Luscious menghadirkan perpaduan sempurna antara tepi yang renyah dan inti yang lembut chewy — menggunakan bahan-bahan pilihan berkualitas tinggi.",
    image: "/product_cookies.png",
    features: ["Baked Fresh Daily", "No Artificial Flavor", "Premium Ingredients"],
    hasVariants: true,
    variants: [
      {
        id: "choco-chip",
        name: "Chocolate Chip Classic",
        description:
          "Paduan cokelat premium dengan adonan vanilla butter yang kaya. Setiap gigitan menghadirkan rasa cokelat meleleh yang autentik dengan tekstur chewy sempurna di tengah dan sedikit crisp di tepi.",
        price: "Rp 45.000 / 6 pcs",
        image: "/product_cookies.png",
        tags: ["Best Seller", "Chocolate", "Classic"],
      },
      {
        id: "red-velvet",
        name: "Red Velvet Cookies",
        description:
          "Terinspirasi dari kue ikonik Red Velvet, cookies ini hadir dengan warna merah menawan dan rasa cocoa ringan yang dipadukan cream cheese filling. Lembut, berkarakter, dan sangat instagrammable.",
        price: "Rp 48.000 / 6 pcs",
        image: "/product_cookies.png",
        tags: ["Premium", "Cream Cheese", "Signature"],
      },
      {
        id: "matcha-white-choc",
        name: "Matcha White Chocolate",
        description:
          "Perpaduan matcha Jepang grade premium dengan white chocolate chips pilihan. Rasa pahit matcha yang elegan berpadu sempurna dengan manisnya white chocolate, menciptakan harmoni cita rasa yang sophisticated.",
        price: "Rp 50.000 / 6 pcs",
        image: "/product_cookies.png",
        tags: ["Matcha", "Japanese Inspired", "Limited"],
      },
      {
        id: "salted-caramel",
        name: "Salted Caramel Crunch",
        description:
          "Cookies butterscotch dengan caramel swirl dan taburan fleur de sel di atasnya. Kontras antara manis karamel dan sentuhan garam laut premium menciptakan profil rasa yang kompleks dan adiktif.",
        price: "Rp 48.000 / 6 pcs",
        image: "/product_cookies.png",
        tags: ["Caramel", "Sea Salt", "Fan Favorite"],
      },
    ],
  },
  {
    id: "donuts",
    slug: "donuts",
    name: "Gourmet Donuts",
    tagline: "Fluffy & Silky Glazes",
    description:
      "Donut brioche-style yang melalui proses fermentasi lambat 24 jam untuk menghasilkan tekstur paling ringan dan fluffy. Setiap donut didekorasi dengan glazes artisan buatan tangan yang visual-first dan lezat.",
    image: "/product_donut.png",
    features: ["24h Slow Fermentation", "Artisan Glaze", "Made to Order"],
    hasVariants: true,
    variants: [
      {
        id: "classic-glazed",
        name: "Classic Glazed",
        description:
          "Kembali ke akar — donut brioche fluffy dengan glazing vanilla klasik yang bersinar. Sederhana namun sempurna. Tekstur yang sangat ringan dengan rasa butter yang kaya menjadikannya favorit sepanjang masa.",
        price: "Rp 18.000 / pcs",
        image: "/product_donut.png",
        tags: ["Classic", "Vanilla", "Best Seller"],
      },
      {
        id: "dark-chocolate",
        name: "Dark Chocolate Ganache",
        description:
          "Dibalut ganache dark chocolate 70% yang glossy dan pekat. Rasa cokelat yang dalam tanpa terlalu manis, dengan finishing cocoa nibs crunch untuk tekstur yang menggugah selera.",
        price: "Rp 22.000 / pcs",
        image: "/product_donut.png",
        tags: ["Dark Chocolate", "70% Cocoa", "Premium"],
      },
      {
        id: "strawberry-bloom",
        name: "Strawberry Bloom",
        description:
          "Glazing strawberry natural berwarna merah muda cantik dengan hiasan bunga edible dan dried strawberry. Rasa buah segar yang autentik tanpa pewarna buatan — secantik rasanya.",
        price: "Rp 22.000 / pcs",
        image: "/product_donut.png",
        tags: ["Strawberry", "Natural Color", "Instagrammable"],
      },
      {
        id: "tiramisu",
        name: "Tiramisu Dream",
        description:
          "Terinspirasi dari dessert Italia legendaris. Donut dicelup dalam mascarpone cream lembut, ditaburi cocoa powder premium dan kopi espresso shot untuk sentuhan dewasa yang sophisticated.",
        price: "Rp 24.000 / pcs",
        image: "/product_donut.png",
        tags: ["Tiramisu", "Coffee", "Signature"],
      },
    ],
  },
  {
    id: "cheesecake",
    slug: "cheesecake",
    name: "Signature Cheesecake",
    tagline: "Velvety Elegance",
    description:
      "Mahkota kebanggaan Cristin Luscious. Cheesecake yang slow-baked dengan cream cheese premium di atas base biscuit caramelized yang sempurna. Tersedia dalam berbagai varian rasa yang masing-masing punya karakter unik.",
    image: "/product_cheesecake.png",
    features: ["Slow Baked 8 Hours", "Premium Cream Cheese", "Handcrafted Daily"],
    hasVariants: true,
    variants: [
      {
        id: "classic-new-york",
        name: "Classic New York",
        description:
          "Cheesecake paling ikonik di dunia, diadaptasi dengan teknik artisan kami. Dense, creamy, dan kaya rasa dengan sedikit sentuhan lemon yang menyegarkan. Base Graham Cracker yang buttery dan crunchy menjadi fondasi sempurna.",
        price: "Rp 65.000 / slice",
        image: "/product_cheesecake.png",
        tags: ["Classic", "New York Style", "Best Seller"],
      },
      {
        id: "burnt-basque",
        name: "Burnt Basque",
        description:
          "Si hitam manis dari San Sebastian, Spanyol. Permukaan yang sengaja dibakar menghasilkan lapisan karamelized yang pahit-manis dan aroma yang memukau, sementara bagian dalam tetap lembut bergetar sempurna.",
        price: "Rp 70.000 / slice",
        image: "/product_cheesecake.png",
        tags: ["Basque Style", "Caramelized", "Signature"],
      },
      {
        id: "oreo-cheesecake",
        name: "Oreo & Cookies Cream",
        description:
          "Perpaduan yang tak tertandingi antara cheesecake creamy kami dengan serpihan Oreo premium yang crunchy. Warna kontras hitam-putih yang dramatis menjadikannya pilihan visual yang memukau sekaligus delicious.",
        price: "Rp 68.000 / slice",
        image: "/product_cheesecake.png",
        tags: ["Oreo", "Cookies & Cream", "Fan Favorite"],
      },
      {
        id: "matcha-cheesecake",
        name: "Japanese Matcha",
        description:
          "Cheesecake bergaya Jepang dengan matcha Uji grade premium yang memberikan warna hijau elegan dan rasa pahit yang complex. Dipadukan dengan white chocolate drizzle untuk keseimbangan rasa yang sempurna.",
        price: "Rp 72.000 / slice",
        image: "/product_cheesecake.png",
        tags: ["Matcha", "Japanese Style", "Premium"],
      },
    ],
  },
  {
    id: "brownies",
    slug: "brownies",
    name: "Decadent Brownies",
    tagline: "Intense Cocoa Sensation",
    description:
      "Brownies fudgy yang dibuat dari cokelat hitam single-origin terbaik. Padat, kaya, dan lembab di dalam dengan lapisan crinkle yang tipis dan glossy di luar. Definisi sesungguhnya dari indulgence.",
    image: "/product_brownies.png",
    features: ["Single-Origin Cocoa", "Fudgy Center", "No Preservatives"],
    hasVariants: true,
    variants: [
      {
        id: "classic-fudgy",
        name: "Classic Fudgy Dark",
        description:
          "Original. Absolut. Tanpa kompromi. Brownies dengan kandungan cokelat 70% dari single-origin terpilih yang memberikan rasa cokelat yang dalam dan kompleks. Setiap gigitan adalah pengalaman yang solid.",
        price: "Rp 35.000 / slice",
        image: "/product_brownies.png",
        tags: ["70% Cocoa", "Classic", "Best Seller"],
      },
      {
        id: "cream-cheese-swirl",
        name: "Cream Cheese Swirl",
        description:
          "Kontras dramatis antara brownies cokelat gelap dan swirl cream cheese yang tangy dan creamy. Visual marbling yang cantik di setiap irisan, dengan rasa yang merupakan pasangan sempurna antara dua dunia.",
        price: "Rp 40.000 / slice",
        image: "/product_brownies.png",
        tags: ["Cream Cheese", "Swirl", "Premium"],
      },
      {
        id: "salted-caramel-brownies",
        name: "Salted Caramel Brownies",
        description:
          "Caramel homemade yang dimasak hingga berwarna emas dituangkan di atas brownies dark chocolate, kemudian diakhiri dengan taburan fleur de sel. Manis, pahit, dan asin — tiga dimensi rasa dalam satu potong.",
        price: "Rp 42.000 / slice",
        image: "/product_brownies.png",
        tags: ["Caramel", "Sea Salt", "Signature"],
      },
      {
        id: "double-choco-nutty",
        name: "Double Choco Nutty",
        description:
          "Untuk pecinta cokelat sejati. Brownies dengan double hit chocolate chip premium dan topping almond panggang renyah. Tekstur yang luar biasa — dense, chewy, dengan crunch almond di setiap suapan.",
        price: "Rp 40.000 / slice",
        image: "/product_brownies.png",
        tags: ["Double Chocolate", "Almond", "Crunchy"],
      },
    ],
  },
  {
    id: "custom-cake",
    slug: "custom-cake",
    name: "Custom Cake",
    tagline: "Tailored Luxury Sculptures",
    description:
      "Kue eksklusif yang dirancang sepenuhnya sesuai visi Anda. Dari desain bertingkat elegan hingga karya seni yang bisa dimakan — tim pastry artist kami siap mewujudkan setiap detail impian Anda menjadi kenyataan yang lezat.",
    image: "/product_custom_cake.png",
    features: ["Fully Custom Design", "Any Flavor Combination", "Artistic Execution"],
    hasVariants: false,
    customNote:
      "Custom Cake kami tersedia dalam berbagai ukuran (6\", 8\", 10\", atau multi-tier) dengan pilihan flavor base, filling, dan frosting yang dapat dikombinasikan sesuai selera. Konsultasikan visi Anda bersama tim kami minimal 7 hari sebelum tanggal acara.",
  },
];

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find((p) => p.slug === slug);
};
