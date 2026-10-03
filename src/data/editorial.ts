import type { EditorialBlock } from "./types";

export const heroContent = {
  eyebrow: "Collection 01 — Living",
  title: "Furniture that sets the mood.",
  body: "Hype is a modern furniture studio working in warm neutrals, honest materials and proportions that feel good to live with. Twenty-four pieces, made in small batches.",
  primaryCta: { label: "Explore Furniture", href: "/furniture" },
  secondaryCta: { label: "View Collection", href: "/collections" },
  image: "/images/editorial/editorial-wide.jpg",
  imageAlt: "Double-height living space with pale sofas, timber kitchen and a sculptural staircase",
  portrait: "/images/editorial/hero-portrait.jpg",
  portraitAlt: "Blue upholstered armchair beside a ladder shelf and a pleated lamp",
  caption: "The Loft Residence — photographed for Hype Editions No. 01",
};

export const tickerItems = [
  "Sofas",
  "Armchairs",
  "Tables",
  "Chairs",
  "Beds",
  "Storage",
  "TV Units",
  "Desks",
  "Benches",
  "Outdoor",
  "Decoration — New Collection",
];

export const editorialSections = {
  slowMornings: {
    id: "slow-mornings",
    eyebrow: "Living",
    title: "Made for slow mornings.",
    body: "A room should ask you to stay. Deep seats, low tables and light that moves across the wall — the furniture in this edit is built for the hours before anyone else is awake.",
    cta: { label: "Shop Sofas", href: "/furniture/sofas" },
    image: "/images/editorial/collection-banner.jpg",
    imageAlt: "Sunlit living room with a pale sofa, fireplace and lounge chairs",
  } satisfies EditorialBlock,

  craft: {
    id: "craft",
    eyebrow: "Studio",
    title: "Cut, joined, finished by hand.",
    body: "Every Hype piece starts as a full-scale drawing and ends on a bench. We work with a small circle of makers in solid oak, walnut, stone and woven fibre — no veneer shortcuts, no hidden plastic.",
    cta: { label: "About the studio", href: "/about" },
    image: "/images/editorial/editorial-two-col-a.jpg",
    secondaryImage: "/images/editorial/editorial-two-col-b.jpg",
    imageAlt: "Warm dining nook with a timber table laid for a meal and soft lamplight",
    secondaryImageAlt: "Still life of coffee, flowers and an open book on a table",
  } satisfies EditorialBlock,

  fullBleed: {
    id: "full-bleed",
    eyebrow: "Editions",
    title: "Rooms worth photographing.",
    body: "Twice a year we photograph Hype pieces in homes that belong to someone else. No stylists, no props — just the furniture doing its job.",
    cta: { label: "See the collection", href: "/furniture" },
    image: "/images/editorial/hero-cover.jpg",
    imageAlt: "Living room with timber chairs, a blue rug and large abstract artwork",
  } satisfies EditorialBlock,

  collage: {
    id: "collage",
    eyebrow: "Material",
    title: "Texture is the whole point.",
    body: "Bouclé that catches the light, paper cord that hums under your hand, oak that darkens where you touch it. Neutral is never the same as plain.",
    cta: { label: "Browse by category", href: "/furniture" },
    image: "/images/editorial/collage-1.jpg",
    secondaryImage: "/images/editorial/collage-2.jpg",
    imageAlt: "Close-up of soft cream pleated fabric",
    secondaryImageAlt: "Close-up of cream bouclé weave",
  } satisfies EditorialBlock,

  comparePromo: {
    id: "compare",
    eyebrow: "Before you decide",
    title: "Compare with alternatives.",
    body: "Open any piece and line it up against its alternatives — price, dimensions, material, colour and availability side by side, without opening six tabs.",
    cta: { label: "Open comparison", href: "/compare" },
    image: "/images/editorial/slow-mornings.jpg",
    imageAlt: "Moody living room with a leather sofa, floor lamp and round coffee table",
  } satisfies EditorialBlock,
} as const;

export const decorationContent = {
  eyebrow: "Category 02",
  title: "Decoration is coming.",
  body: "Vessels, textiles, lighting and the small objects that make a room feel finished. Hype Decoration is in development with the same makers as our furniture — launching soon, in the same warm neutrals.",
  note: "Leave your address and we will write to you once, when it opens.",
  image: "/images/editorial/decoration-coming.jpg",
  imageAlt: "Ceramic vessels and dried flowers on a mantel beside a fireplace",
  previewItems: [
    { label: "Vessels & Ceramics", status: "In design" },
    { label: "Textiles", status: "Sampling" },
    { label: "Lighting", status: "In design" },
    { label: "Objects", status: "Coming soon" },
  ],
};

export const aboutContent = {
  eyebrow: "About Hype",
  title: "A furniture studio for rooms that are actually lived in.",
  lead:
    "Hype began with a simple frustration: most furniture is designed to be photographed once and forgotten. We wanted pieces that look better in year five than on day one.",
  image: "/images/editorial/about-studio.jpg",
  imageAlt: "Craftsperson carving timber by hand in a warm workshop",
  detailImage: "/images/editorial/about-detail.jpg",
  detailImageAlt: "Close-up of woven upholstery fabric in warm daylight",
  portraitImage: "/images/editorial/editorial-two-col-a.jpg",
  portraitImageAlt: "Still life with coffee, flowers and an open book",
  chapters: [
    {
      number: "01",
      title: "Drawn at full scale",
      body: "Nothing goes into production until it has been drawn at 1:1 and sat in. Proportions are tested with real people in real rooms, not on a screen.",
    },
    {
      number: "02",
      title: "Made in small batches",
      body: "We produce in runs of forty to eighty pieces. It keeps quality high, waste low, and lets us change a detail when we learn something.",
    },
    {
      number: "03",
      title: "Materials that age",
      body: "Solid oak, walnut, stone, leather, wool and linen. Everything we use is chosen because it gets better with wear rather than worse.",
    },
    {
      number: "04",
      title: "Delivered properly",
      body: "White-glove delivery and in-room assembly by the same team, so the piece arrives finished, placed and ready to use.",
    },
  ],
  facts: [
    { value: "24", label: "Pieces in the permanent collection" },
    { value: "10", label: "Furniture categories" },
    { value: "40–80", label: "Units per production batch" },
    { value: "10 yr", label: "Guarantee on every frame" },
  ],
};
