import { Item } from "./types";

const CDN = "https://cdn.shopify.com/s/files/1/0851/9358/9041/files";

interface Product {
  image: string;
  color: string;
  caption: string | null;
  aspect: number;
}

const PRODUCTS: Product[] = [
  {
    image: `${CDN}/blueRazzIceLostMaryMO50001.jpg?v=1730260525`,
    color: "#4785E8",
    caption: "Blue Razz Ice — MO5000",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Lost-Mary-MO5000-Disposable---Miami-Mint.jpg?v=1715343407`,
    color: "#47D4E8",
    caption: "Miami Mint — MO5000",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Lost-Mary-MO5000-Disposable---Strawberry-Ice.jpg?v=1715345878`,
    color: "#E85454",
    caption: "Strawberry Ice — MO5000",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Watermelon-Ice-Lost-Mary-MO5000.png?v=1707761472`,
    color: "#47E88C",
    caption: "Watermelon Ice — MO5000",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Grape-Jelly-Lost-Mary-MO5000.png?v=1707761058`,
    color: "#A347E8",
    caption: "Grape Jelly — MO5000",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Lost-Mary-MO5000-Disposable---Blackberry-Cherry-Lemon.jpg?v=1715337520`,
    color: "#E847A3",
    caption: "Blackberry Cherry Lemon — MO5000",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Lost-Mary-MO5000-Disposable---Tropical-Fruit.jpg?v=1715346827`,
    color: "#E8C547",
    caption: "Tropical Fruit — MO5000",
    aspect: 1.0,
  },
  // Detail / lifestyle shots — use taller cards for these
  {
    image: `${CDN}/Blue_Razz_Ice_Lost_Mary_MO5000_2.jpg?v=1730260618`,
    color: "#4785E8",
    caption: "Just dropped — try it",
    aspect: 1.4,
  },
  {
    image: `${CDN}/Miami_Mint_Lost_Mary_MO5000_Disposable_Vape.webp?v=1727809588`,
    color: "#47D4E8",
    caption: "Customer favorite",
    aspect: 1.4,
  },
  {
    image: `${CDN}/Strawberry_Ice_Lost_Mary_MO5000_Disposable_Vape.webp?v=1727813239`,
    color: "#E85454",
    caption: "Fan favorite",
    aspect: 1.4,
  },
  {
    image: `${CDN}/Watermelon_Ice_Lost_Mary_MO5000_Disposable_Vape.webp?v=1727815199`,
    color: "#47E88C",
    caption: "New flavor alert",
    aspect: 1.4,
  },
  {
    image: `${CDN}/Grape_Jelly_Lost_Mary_MO5000_Disposable_Vape.webp?v=1727794365`,
    color: "#A347E8",
    caption: "Staff pick of the week",
    aspect: 1.4,
  },
  {
    image: `${CDN}/Blackberry_Cherry_Lemon_Lost_Mary_MO5000_Disposable_Vape.webp?v=1727790046`,
    color: "#E847A3",
    caption: "Hot seller — grab it",
    aspect: 1.4,
  },
  {
    image: `${CDN}/Tropical_Fruit_Lost_Mary_MO5000_Disposable_Vape.webp?v=1727814578`,
    color: "#E8C547",
    caption: null,
    aspect: 1.4,
  },
  // Box / packaging shots — wide aspect for featured cards
  {
    image: `${CDN}/Blue_Razz_Ice_Lost_Mary_MO5000_4.jpg?v=1730260634`,
    color: "#4785E8",
    caption: "Blue Razz Ice — fan favorite",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Miami_Mint_Lost_Mary_MO5000_Disposable_Vape_With_Package_Box.webp?v=1727809589`,
    color: "#47D4E8",
    caption: "Fresh Lost Marys on the shelf",
    aspect: 1.0,
  },
  {
    image: `${CDN}/WatermelonIce-01_3336fc06-8552-4663-9e7b-1ee2917e6f73_1.webp?v=1727943224`,
    color: "#47E88C",
    caption: null,
    aspect: 1.0,
  },
  {
    image: `${CDN}/Grape_Jelly_Lost_Mary_MO5000_Disposable_Vape_With_Package_Box.webp?v=1727794365`,
    color: "#A347E8",
    caption: "New Lost Marys just landed",
    aspect: 1.0,
  },
  {
    image: `${CDN}/Blackberry_Cherry_Lemon_Lost_Mary_MO5000_Disposable_Vape_With_Package_Box.webp?v=1727790046`,
    color: "#E847A3",
    caption: "Exclusive colorway",
    aspect: 0.75,
  },
  {
    image: `${CDN}/Tropical_Fruit_Lost_Mary_MO5000_Disposable_Vape_With_Package_Box.webp?v=1727814579`,
    color: "#E8C547",
    caption: "5000 puffs — rechargeable",
    aspect: 0.75,
  },
  {
    image: `${CDN}/Blue_Razz_Ice_Lost_Mary_MO5000.jpg?v=1730260625`,
    color: "#4785E8",
    caption: "Lost Mary MO5000 — mesh coil",
    aspect: 1.0,
  },
];

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

export function generateMockItems(count = 30, page = 0): Item[] {
  return Array.from({ length: count }, (_, i) => {
    const product = PRODUCTS[i % PRODUCTS.length];
    return {
      id: `mock-${page}-${i}`,
      store_id: "x-smoke-shop",
      image_url: product.image,
      thumb_url: product.image,
      blurhash: null,
      caption: product.caption,
      created_at: hoursAgo(Math.random() * 168),
      status: "ready" as const,
      aspect_ratio: product.aspect,
      dominant_color: product.color,
      quality_score: 0.5 + Math.random() * 0.5,
      impressions: Math.floor(Math.random() * 500),
      opens: Math.floor(Math.random() * 80),
      avg_dwell: Math.random() * 20,
      ctr: Math.random() * 0.15,
    };
  });
}

