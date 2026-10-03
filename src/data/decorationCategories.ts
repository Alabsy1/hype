import type { Category } from "./types";

export const decorationCategories: Category[] = [
  {
    slug: "mirrors",
    name: "Mirrors",
    tagline: "Quiet reflections",
    description:
      "Round, oval and arched mirrors in oak, brass and rattan — placed to borrow light from one side of the room and spend it on the other.",
    image: "/images/decoration/categories/mirrors.webp",
    order: 1,
    department: "decoration",
  },
  {
    slug: "lighting",
    name: "Lighting",
    tagline: "Warmth after dark",
    description:
      "Table lamps in glass, ceramic and oak with linen shades — small pools of warm light for corners, consoles and bedside tables.",
    image: "/images/decoration/categories/lighting.webp",
    order: 2,
    department: "decoration",
  },
  {
    slug: "vases",
    name: "Vases",
    tagline: "Vessels with presence",
    description:
      "Hand-finished ceramic and stoneware vessels, from sculptural singles to quiet bud vases — beautiful empty, better with a stem.",
    image: "/images/decoration/categories/vases.webp",
    order: 3,
    department: "decoration",
  },
  {
    slug: "rugs",
    name: "Rugs",
    tagline: "Softness underfoot",
    description:
      "Hand-loomed wool and flatweave rugs in undyed neutrals — the layer that makes hard floors feel like part of the furniture.",
    image: "/images/decoration/categories/rugs.webp",
    order: 4,
    department: "decoration",
  },
  {
    slug: "wall-art",
    name: "Wall Art",
    tagline: "Walls that speak quietly",
    description:
      "Muted prints and canvases in oak and walnut frames — abstract, architectural, and calm enough to live with for decades.",
    image: "/images/decoration/categories/wall-art.webp",
    order: 5,
    department: "decoration",
  },
  {
    slug: "cushions-throws",
    name: "Cushions & Throws",
    tagline: "Softness you can rearrange",
    description:
      "Stonewashed linen, undyed wool and brushed cotton — cushions and throws that soften hard lines and invite rearrangement.",
    image: "/images/decoration/categories/cushions-throws.webp",
    order: 6,
    department: "decoration",
  },
  {
    slug: "candles-holders",
    name: "Candles & Holders",
    tagline: "Light in small doses",
    description:
      "Brass, ceramic and steel holders with clean-burning candles — the fastest way to change the mood of a room after dark.",
    image: "/images/decoration/categories/candles-holders.webp",
    order: 7,
    department: "decoration",
  },
  {
    slug: "planters",
    name: "Planters",
    tagline: "Green, contained",
    description:
      "Ceramic, stone and terracotta planters that treat plants like residents rather than accessories — drainage, saucers and all.",
    image: "/images/decoration/categories/planters.webp",
    order: 8,
    department: "decoration",
  },
];

export const getDecorationCategory = (slug: string) =>
  decorationCategories.find((category) => category.slug === slug);
