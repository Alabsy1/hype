import type { EditorialBlock } from "./types";

/**
 * Static landing content for the Decoration catalog. Kept in a data module —
 * like the furniture editorial content — so a future CMS/dashboard can replace
 * it without touching page components.
 */
export const decorationHero = {
  eyebrow: "Category 02 — The new collection",
  title: "The quiet layer.",
  body: "Twenty-four pieces across eight categories — mirrors, lighting, vessels, rugs, art, textiles, candlelight and planters. The small objects that make a room feel finished, in the same warm neutrals as the furniture.",
  primaryCta: { label: "Browse the collection", href: "#collection" },
  secondaryCta: { label: "Shop by category", href: "#categories" },
  image: "/images/decoration/categories/mirrors.webp",
  imageAlt: "Round oak-framed mirror in a warm neutral entryway",
};

export const decorationSections = {
  material: {
    id: "decoration-material",
    eyebrow: "Material",
    title: "Made to be touched.",
    body: "Glazed stoneware, hand-loomed wool, brushed brass, oiled oak — every decoration piece is chosen for how it feels in the hand, not just how it photographs.",
    cta: { label: "Shop textiles", href: "/decoration/cushions-throws" },
    image: "/images/decoration/products/lino-throw-1.webp",
    imageAlt: "Folded undyed linen throws in warm neutral tones",
    secondaryImage: "/images/decoration/products/orso-vase-duo-1.webp",
    secondaryImageAlt: "Two handmade ceramic vessels in sand tones",
  } satisfies EditorialBlock,

  fullBleed: {
    id: "decoration-editions",
    eyebrow: "Editions",
    title: "Small pieces, long lives.",
    body: "Decoration is bought in a moment and lived with for decades. Every piece is made to be kept — repaired, not replaced.",
    cta: { label: "Shop bestsellers", href: "/decoration" },
    image: "/images/decoration/categories/lighting.webp",
    imageAlt: "Warm lamplight in a calm neutral interior corner",
  } satisfies EditorialBlock,
} as const;

export const decorationPairing = {
  eyebrow: "Pairs well with",
  title: "Furniture, meet decoration.",
  body: "Every decoration piece is scaled and toned to sit next to the furniture collection — same palette, same makers, same patience.",
  image: "/images/editorial/editorial-wide.jpg",
  imageAlt: "Double-height living space with pale sofas and warm timber",
  cta: { label: "Explore Furniture", href: "/furniture" },
};
