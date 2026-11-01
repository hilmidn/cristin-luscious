/**
 * Katalog awal Cristin Luscious — dipakai `prisma/seed.ts`.
 * Foto belum tersedia: `image` dikosongkan agar otomatis memakai
 * `/placeholder-product.png` lewat `productImageSrc()`.
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
    slug: "cheesecake",
    name: "Signature Cheesecake",
    tagline: "Velvety Indulgence",
    description:
      "Cheesecake slow-baked dengan cream cheese premium di atas base biscuit butter yang renyah. Teksturnya padat namun lembut, dengan rasa seimbang antara manis, gurih, dan sedikit tangy. Setiap varian diberi topping atau spread pilihan dan dibuat dalam batch terbatas supaya selalu fresh saat sampai di tanganmu.",
    image: "",
    features: [
      "Slow Baked",
      "Premium Cream Cheese",
      "Fresh Batch Harian",
    ],
    customNote: null,
    sortOrder: 0,
    published: true,
    variants: [
      {
        slug: "strawberry",
        name: "Strawberry",
        description:
          "Cheesecake creamy dengan saus stroberi segar yang asam-manis, memberi kontras ringan di antara lembutnya cream cheese. Pilihan paling aman untuk semua orang.",
        price: 39000,
        priceUnit: "slice",
        image: "",
        tags: ["Fruity", "Best Seller", "Fresh"],
        sortOrder: 0,
        published: true,
      },
      {
        slug: "blueberry",
        name: "Blueberry",
        description:
          "Topping blueberry yang pekat dengan sedikit rasa earthy, berpadu dengan base biscuit butter yang gurih. Manisnya dalam, tidak sekadar manis gula.",
        price: 39000,
        priceUnit: "slice",
        image: "",
        tags: ["Fruity", "Classic", "Best Seller"],
        sortOrder: 1,
        published: true,
      },
      {
        slug: "nutella",
        name: "Nutella",
        description:
          "Lapisan Nutella hazelnut yang lumer di atas cheesecake dingin, menghasilkan kombinasi cokelat-hazelnut yang rich dan indulgent. Untuk yang tidak bisa berhenti di satu gigitan.",
        price: 39000,
        priceUnit: "slice",
        image: "",
        tags: ["Chocolate", "Hazelnut", "Indulgent"],
        sortOrder: 2,
        published: true,
      },
      {
        slug: "lotus-biscoff",
        name: "Lotus Biscoff",
        description:
          "Spread Biscoff karamel dengan remahan biskuit Lotus di atasnya. Rasa karamel yang hangat dan sedikit spiced, paling pas dinikmati bersama kopi.",
        price: 39000,
        priceUnit: "slice",
        image: "",
        tags: ["Caramel", "Biscoff", "Signature"],
        sortOrder: 3,
        published: true,
      },
    ],
  },
  {
    slug: "cinnamon-roll",
    name: "Cinnamon Roll",
    tagline: "Warm & Gooey",
    description:
      "Roti gulung lembut dengan filling kayu manis dan gula palem, dipanggang sampai harum lalu dilapisi glaze atau spread pilihan. Teksturnya fluffy di dalam, dengan lapisan luar yang sedikit lengket manis — paling nikmat dihangatkan sebentar sebelum disantap.",
    image: "",
    features: ["Soft & Fluffy", "Hand-Rolled", "Freshly Baked"],
    customNote: null,
    sortOrder: 1,
    published: true,
    variants: [
      {
        slug: "classic",
        name: "Classic",
        description:
          "Versi paling jujur: kayu manis, gula palem, dan glaze tipis yang meleleh. Aroma rempahnya hangat, manisnya tidak berlebihan.",
        price: 16000,
        priceUnit: "pcs",
        image: "",
        tags: ["Classic", "Cinnamon", "Best Seller"],
        sortOrder: 0,
        published: true,
      },
      {
        slug: "lotus-biscoff",
        name: "Lotus Biscoff",
        description:
          "Cinnamon roll dengan spread Biscoff karamel dan remahan biskuit di atasnya. Manisnya lebih dalam, dengan sentuhan renyah di setiap gigitan.",
        price: 16000,
        priceUnit: "pcs",
        image: "",
        tags: ["Biscoff", "Caramel", "Signature"],
        sortOrder: 1,
        published: true,
      },
      {
        slug: "cookies-and-cream",
        name: "Cookies & Cream",
        description:
          "Filling kayu manis dipadukan krim vanilla dan remahan cookies cokelat. Lembut, creamy, dengan tekstur biskuit yang bikin nagih.",
        price: 16000,
        priceUnit: "pcs",
        image: "",
        tags: ["Cookies & Cream", "Creamy", "Fan Favorite"],
        sortOrder: 2,
        published: true,
      },
      {
        slug: "strawberry",
        name: "Strawberry",
        description:
          "Spread stroberi asam-manis di atas roll hangat, memberi rasa segar di antara lembutnya roti dan manisnya glaze.",
        price: 16000,
        priceUnit: "pcs",
        image: "",
        tags: ["Fruity", "Fresh", "Sweet"],
        sortOrder: 3,
        published: true,
      },
      {
        slug: "vanilla-almond",
        name: "Vanilla Almond",
        description:
          "Glaze vanilla lembut ditaburi almond panggang yang crunchy. Aroma almondnya nutty dan hangat, paling ringan di antara varian lainnya.",
        price: 16000,
        priceUnit: "pcs",
        image: "",
        tags: ["Nutty", "Vanilla", "Crunchy"],
        sortOrder: 4,
        published: true,
      },
    ],
  },
  {
    slug: "donut",
    name: "Gourmet Donut",
    tagline: "Bite-Sized Luxury",
    description:
      "Donut dengan adonan lembut dan filling creamy yang generous — bukan sekadar lapisan tipis di permukaan. Tersedia sepuluh rasa, dari custard klasik sampai matcha dan tiramisu, semuanya dibuat dalam porsi kecil supaya bisa dicoba beberapa sekaligus.",
    image: "",
    features: ["Soft Dough", "Generous Filling", "Made to Order"],
    customNote: null,
    sortOrder: 2,
    published: true,
    variants: [
      {
        slug: "creme-brulee",
        name: "Crème Brûlée",
        description:
          "Vanilla custard cream with caramelized sugar topping.",
        price: 12000,
        priceUnit: "pcs",
        image: "",
        tags: ["Custard", "Caramelized", "Signature"],
        sortOrder: 0,
        published: true,
      },
      {
        slug: "strawberry-cheesecake",
        name: "Strawberry Cheesecake",
        description:
          "Creamy cheesecake filling with fresh strawberry sauce.",
        price: 12000,
        priceUnit: "pcs",
        image: "",
        tags: ["Fruity", "Cream Cheese", "Fan Favorite"],
        sortOrder: 1,
        published: true,
      },
      {
        slug: "citrus-kiss",
        name: "Citrus Kiss",
        description: "Lemon cream filling topped with candied lemon.",
        price: 12000,
        priceUnit: "pcs",
        image: "",
        tags: ["Citrus", "Fresh", "Bright"],
        sortOrder: 2,
        published: true,
      },
      {
        slug: "oreo",
        name: "Oreo",
        description:
          "Vanilla chocolate cream topped with crunchy Oreo crumbs.",
        price: 10000,
        priceUnit: "pcs",
        image: "",
        tags: ["Oreo", "Chocolate", "Best Seller"],
        sortOrder: 3,
        published: true,
      },
      {
        slug: "lotus-biscoff",
        name: "Lotus Biscoff",
        description:
          "Smooth Biscoff spread with Lotus crumble topping.",
        price: 12000,
        priceUnit: "pcs",
        image: "",
        tags: ["Biscoff", "Caramel", "Best Seller"],
        sortOrder: 4,
        published: true,
      },
      {
        slug: "nutella-almond",
        name: "Nutella Almond",
        description:
          "Creamy hazelnut chocolate filling with toasted almond topping.",
        price: 10000,
        priceUnit: "pcs",
        image: "",
        tags: ["Nutella", "Hazelnut", "Crunchy"],
        sortOrder: 5,
        published: true,
      },
      {
        slug: "classic-matcha",
        name: "Classic Matcha",
        description:
          "Matcha cream filling topped with milky matcha powder.",
        price: 12000,
        priceUnit: "pcs",
        image: "",
        tags: ["Matcha", "Earthy", "Premium"],
        sortOrder: 6,
        published: true,
      },
      {
        slug: "tiramisu-regal",
        name: "Tiramisu Regal",
        description:
          "Coffee cream layered with classic Regal biscuits.",
        price: 10000,
        priceUnit: "pcs",
        image: "",
        tags: ["Coffee", "Biscuit", "Classic"],
        sortOrder: 7,
        published: true,
      },
      {
        slug: "choco-luscious",
        name: "Choco Luscious",
        description: "Rich chocolate ganache with a super smooth finish.",
        price: 12000,
        priceUnit: "pcs",
        image: "",
        tags: ["Chocolate", "Ganache", "Signature"],
        sortOrder: 8,
        published: true,
      },
      {
        slug: "apple-crumble",
        name: "Apple Crumble",
        description:
          "Cinnamon apple filling topped with buttery crumble.",
        price: 12000,
        priceUnit: "pcs",
        image: "",
        tags: ["Apple", "Cinnamon", "Crumble"],
        sortOrder: 9,
        published: true,
      },
    ],
  },
];
