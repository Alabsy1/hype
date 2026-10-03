import type { Collection } from "./types";

export const collections: Collection[] = [
  {
    slug: "new-arrivals",
    name: "New Arrivals",
    eyebrow: "Just landed",
    description: "The latest pieces to leave the workshop.",
    products: ["lume-sofa", "halo-swivel-chair", "orbit-coffee-table", "favo-chair", "nook-media-console", "seta-dining-bench"],
  },
  {
    slug: "living-room",
    name: "Living Room",
    eyebrow: "The soft half of the house",
    description: "Sofas, chairs and tables composed for rooms that are used every day.",
    products: ["orsa-modular-sofa", "vela-sectional", "nube-armchair", "orbit-coffee-table", "tavo-credenza", "pila-side-table"],
  },
  {
    slug: "best-sellers",
    name: "Best Sellers",
    eyebrow: "Most lived with",
    description: "The pieces people return for, and send their friends to buy.",
    products: ["nube-armchair", "corda-dining-chair", "vela-sectional", "riga-shelving", "isola-lounge", "orsa-modular-sofa"],
  },
  {
    slug: "quiet-mornings",
    name: "Quiet Mornings",
    eyebrow: "Bedroom edit",
    description: "Beds, benches and low storage for the slowest room in the house.",
    products: ["onda-bed", "sabbia-platform-bed", "ponte-bench", "scriv-desk", "riga-shelving", "pila-side-table"],
  },
];

export const getCollection = (slug: string) =>
  collections.find((collection) => collection.slug === slug);
