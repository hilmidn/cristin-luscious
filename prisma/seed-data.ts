/**
 * Initial catalog data migrated from the old static `lib/products.ts`.
 * Used once by `prisma/seed.ts`; the public site reads from the database.
 */

export type SeedVariant = {
  slug: string;
  name: string;
  description: string;
  price: number | null;
  priceUnit: string | null;
  image: string;
  tags: string[];
  sortOrder: number;
  published: boolean;
};

export type SeedProduct = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  features: string[];
  customNote: string | null;
  sortOrder: number;
  published: boolean;
  variants: SeedVariant[];
};

export const seedProducts: SeedProduct[] = [
  {
    slug: "cookies",
    name: "Handcrafted Cookies",
    tagline: "Crisp Edges, Chewy Core",
    description:
      "Dibuat secara artisan dalam jumlah terbatas setiap harinya. Setiap keping cookies Cristin Luscious menghadirkan perpaduan sempurna antara tepi yang renyah dan inti yang lembut chewy — menggunakan bahan-bahan pilihan berkualitas tinggi.",
    image: "/product_cookies.png",
    features: [
      "Baked Fresh Daily",
      "No Artificial Flavor",
      "Premium Ingredients",
    ],
    customNote: null,
    sortOrder: 0,
    published: true,
    variants: [
      {
        slug: "choco-chip",
        name: "Chocolate Chip Classic",
        description:
          "Paduan cokelat premium dengan adonan vanilla butter yang kaya. Setiap gigitan menghadirkan rasa cokelat meleleh yang autentik dengan tekstur chewy sempurna di tengah dan sedikit crisp di tepi.",
        price: 45000,
        priceUnit: "6 pcs",
        image: "/product_cookies.png",
        tags: ["Best Seller", "Chocolate", "Classic"],
        sortOrder: 0,
        published: true,
      },
      {
        slug: "red-velvet",
        name: "Red Velvet Cookies",
        description:
          "Terinspirasi dari kue ikonik Red Velvet, cookies ini hadir dengan warna merah menawan dan rasa cocoa ringan yang dipadukan cream cheese filling. Lembut, berkarakter, dan sangat instagrammable.",
        price: 48000,
        priceUnit: "6 pcs",
        image: "/product_cookies.png",
        tags: ["Premium", "Cream Cheese", "Signature"],
        sortOrder: 1,
        published: true,
      },
      {
        slug: "matcha-white-choc",
        name: "Matcha White Chocolate",
        description:
          "Perpaduan matcha Jepang grade premium dengan white chocolate chips pilihan. Rasa pahit matcha yang elegan berpadu sempurna dengan manisnya white chocolate, menciptakan harmoni cita rasa yang sophisticated.",
        price: 50000,
        priceUnit: "6 pcs",
        image: "/product_cookies.png",
        tags: ["Matcha", "Japanese Inspired", "Limited"],
        sortOrder: 2,
        published: true,
      },
      {
        slug: "salted-caramel",
        name: "Salted Caramel Crunch",
        description:
          "Cookies butterscotch dengan caramel swirl dan taburan fleur de sel di atasnya. Kontras antara manis karamel dan sentuhan garam laut premium menciptakan profil rasa yang kompleks dan adiktif.",
        price: 48000,
        priceUnit: "6 pcs",
        image: "/product_cookies.png",
        tags: ["Caramel", "Sea Salt", "Fan Favorite"],
        sortOrder: 3,
        published: true,
      },
    ],
  },
  {
    slug: "donuts",
    name: "Gourmet Donuts",
    tagline: "Fluffy & Silky Glazes",
    description:
      "Donut brioche-style yang melalui proses fermentasi lambat 24 jam untuk menghasilkan tekstur paling ringan dan fluffy. Setiap donut didekorasi dengan glazes artisan buatan tangan yang visual-first dan lezat.",
    image: "/product_donut.png",
    features: ["24h Slow Fermentation", "Artisan Glaze", "Made to Order"],
    customNote: null,
    sortOrder: 1,
    published: true,
    variants: [
      {
        slug: "classic-glazed",
        name: "Classic Glazed",
        description:
          "Kembali ke akar — donut brioche fluffy dengan glazing vanilla klasik yang bersinar. Sederhana namun sempurna. Tekstur yang sangat ringan dengan rasa butter yang kaya menjadikannya favorit sepanjang masa.",
        price: 18000,
        priceUnit: "pcs",
        image: "/product_donut.png",
        tags: ["Classic", "Vanilla", "Best Seller"],
        sortOrder: 0,
        published: true,
      },
      {
        slug: "dark-chocolate",
        name: "Dark Chocolate Ganache",
        description:
          "Dibalut ganache dark chocolate 70% yang glossy dan pekat. Rasa cokelat yang dalam tanpa terlalu manis, dengan finishing cocoa nibs crunch untuk tekstur yang menggugah selera.",
        price: 22000,
        priceUnit: "pcs",
        image: "/product_donut.png",
        tags: ["Dark Chocolate", "70% Cocoa", "Premium"],
        sortOrder: 1,
        published: true,
      },
      {
        slug: "strawberry-bloom",
        name: "Strawberry Bloom",
        description:
          "Glazing strawberry natural berwarna merah muda cantik dengan hiasan bunga edible dan dried strawberry. Rasa buah segar yang autentik tanpa pewarna buatan — secantik rasanya.",
        price: 22000,
        priceUnit: "pcs",
        image: "/product_donut.png",
        tags: ["Strawberry", "Natural Color", "Instagrammable"],
        sortOrder: 2,
        published: true,
      },
      {
        slug: "tiramisu",
        name: "Tiramisu Dream",
        description:
          "Terinspirasi dari dessert Italia legendaris. Donut dicelup dalam mascarpone cream lembut, ditaburi cocoa powder premium dan kopi espresso shot untuk sentuhan dewasa yang sophisticated.",
        price: 24000,
        priceUnit: "pcs",
        image: "/product_donut.png",
        tags: ["Tiramisu", "Coffee", "Signature"],
        sortOrder: 3,
        published: true,
      },
    ],
  },
  {
    slug: "cheesecake",
    name: "Signature Cheesecake",
    tagline: "Velvety Elegance",
    description:
      "Mahkota kebanggaan Cristin Luscious. Cheesecake yang slow-baked dengan cream cheese premium di atas base biscuit caramelized yang sempurna. Tersedia dalam berbagai varian rasa yang masing-masing punya karakter unik.",
    image: "/product_cheesecake.png",
    features: [
      "Slow Baked 8 Hours",
      "Premium Cream Cheese",
      "Handcrafted Daily",
    ],
    customNote: null,
    sortOrder: 2,
    published: true,
    variants: [
      {
        slug: "classic-new-york",
        name: "Classic New York",
        description:
          "Cheesecake paling ikonik di dunia, diadaptasi dengan teknik artisan kami. Dense, creamy, dan kaya rasa dengan sedikit sentuhan lemon yang menyegarkan. Base Graham Cracker yang buttery dan crunchy menjadi fondasi sempurna.",
        price: 65000,
        priceUnit: "slice",
        image: "/product_cheesecake.png",
        tags: ["Classic", "New York Style", "Best Seller"],
        sortOrder: 0,
        published: true,
      },
      {
        slug: "burnt-basque",
        name: "Burnt Basque",
        description:
          "Si hitam manis dari San Sebastian, Spanyol. Permukaan yang sengaja dibakar menghasilkan lapisan karamelized yang pahit-manis dan aroma yang memukau, sementara bagian dalam tetap lembut bergetar sempurna.",
        price: 70000,
        priceUnit: "slice",
        image: "/product_cheesecake.png",
        tags: ["Basque Style", "Caramelized", "Signature"],
        sortOrder: 1,
        published: true,
      },
      {
        slug: "oreo-cheesecake",
        name: "Oreo & Cookies Cream",
        description:
          "Perpaduan yang tak tertandingi antara cheesecake creamy kami dengan serpihan Oreo premium yang crunchy. Warna kontras hitam-putih yang dramatis menjadikannya pilihan visual yang memukau sekaligus delicious.",
        price: 68000,
        priceUnit: "slice",
        image: "/product_cheesecake.png",
        tags: ["Oreo", "Cookies & Cream", "Fan Favorite"],
        sortOrder: 2,
        published: true,
      },
      {
        slug: "matcha-cheesecake",
        name: "Japanese Matcha",
        description:
          "Cheesecake bergaya Jepang dengan matcha Uji grade premium yang memberikan warna hijau elegan dan rasa pahit yang complex. Dipadukan dengan white chocolate drizzle untuk keseimbangan rasa yang sempurna.",
        price: 72000,
        priceUnit: "slice",
        image: "/product_cheesecake.png",
        tags: ["Matcha", "Japanese Style", "Premium"],
        sortOrder: 3,
        published: true,
      },
    ],
  },
  {
    slug: "brownies",
    name: "Decadent Brownies",
    tagline: "Intense Cocoa Sensation",
    description:
      "Brownies fudgy yang dibuat dari cokelat hitam single-origin terbaik. Padat, kaya, dan lembab di dalam dengan lapisan crinkle yang tipis dan glossy di luar. Definisi sesungguhnya dari indulgence.",
    image: "/product_brownies.png",
    features: ["Single-Origin Cocoa", "Fudgy Center", "No Preservatives"],
    customNote: null,
    sortOrder: 3,
    published: true,
    variants: [
      {
        slug: "classic-fudgy",
        name: "Classic Fudgy Dark",
        description:
          "Original. Absolut. Tanpa kompromi. Brownies dengan kandungan cokelat 70% dari single-origin terpilih yang memberikan rasa cokelat yang dalam dan kompleks. Setiap gigitan adalah pengalaman yang solid.",
        price: 35000,
        priceUnit: "slice",
        image: "/product_brownies.png",
        tags: ["70% Cocoa", "Classic", "Best Seller"],
        sortOrder: 0,
        published: true,
      },
      {
        slug: "cream-cheese-swirl",
        name: "Cream Cheese Swirl",
        description:
          "Kontras dramatis antara brownies cokelat gelap dan swirl cream cheese yang tangy dan creamy. Visual marbling yang cantik di setiap irisan, dengan rasa yang merupakan pasangan sempurna antara dua dunia.",
        price: 40000,
        priceUnit: "slice",
        image: "/product_brownies.png",
        tags: ["Cream Cheese", "Swirl", "Premium"],
        sortOrder: 1,
        published: true,
      },
      {
        slug: "salted-caramel-brownies",
        name: "Salted Caramel Brownies",
        description:
          "Caramel homemade yang dimasak hingga berwarna emas dituangkan di atas brownies dark chocolate, kemudian diakhiri dengan taburan fleur de sel. Manis, pahit, dan asin — tiga dimensi rasa dalam satu potong.",
        price: 42000,
        priceUnit: "slice",
        image: "/product_brownies.png",
        tags: ["Caramel", "Sea Salt", "Signature"],
        sortOrder: 2,
        published: true,
      },
      {
        slug: "double-choco-nutty",
        name: "Double Choco Nutty",
        description:
          "Untuk pecinta cokelat sejati. Brownies dengan double hit chocolate chip premium dan topping almond panggang renyah. Tekstur yang luar biasa — dense, chewy, dengan crunch almond di setiap suapan.",
        price: 40000,
        priceUnit: "slice",
        image: "/product_brownies.png",
        tags: ["Double Chocolate", "Almond", "Crunchy"],
        sortOrder: 3,
        published: true,
      },
    ],
  },
  {
    slug: "custom-cake",
    name: "Custom Cake",
    tagline: "Tailored Luxury Sculptures",
    description:
      "Kue eksklusif yang dirancang sepenuhnya sesuai visi Anda. Dari desain bertingkat elegan hingga karya seni yang bisa dimakan — tim pastry artist kami siap mewujudkan setiap detail impian Anda menjadi kenyataan yang lezat.",
    image: "/product_custom_cake.png",
    features: [
      "Fully Custom Design",
      "Any Flavor Combination",
      "Artistic Execution",
    ],
    customNote:
      'Custom Cake kami tersedia dalam berbagai ukuran (6", 8", 10", atau multi-tier) dengan pilihan flavor base, filling, dan frosting yang dapat dikombinasikan sesuai selera. Konsultasikan visi Anda bersama tim kami minimal 7 hari sebelum tanggal acara.',
    sortOrder: 4,
    published: true,
    variants: [],
  },
];
