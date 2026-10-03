import type { Category } from "./types";

export const categories: Category[] = [
  {
    slug: "sofas",
    name: "Sofas",
    tagline: "Deep seats, quiet silhouettes",
    description:
      "Low, generous sofas built around the way a room is actually lived in — long evenings, slow Sundays, and everything in between.",
    image: "/images/categories/sofas.jpg",
    order: 1,
  },
  {
    slug: "armchairs",
    name: "Armchairs",
    tagline: "A seat of one's own",
    description:
      "Sculptural armchairs with soft curves and honest materials, made to hold a corner of the room on their own terms.",
    image: "/images/categories/armchairs.jpg",
    order: 2,
  },
  {
    slug: "tables",
    name: "Tables",
    tagline: "Where the day gathers",
    description:
      "Dining, coffee and side tables in solid timber and stone — surfaces designed to age into the room rather than out of it.",
    image: "/images/categories/tables.jpg",
    order: 3,
  },
  {
    slug: "chairs",
    name: "Chairs",
    tagline: "Considered from every angle",
    description:
      "Dining and accent chairs with tactile frames, woven seats and proportions that stay comfortable long after dinner.",
    image: "/images/categories/chairs.jpg",
    order: 4,
  },
  {
    slug: "beds",
    name: "Beds",
    tagline: "The softest architecture",
    description:
      "Upholstered and timber bed frames with low profiles, generous headboards and a calm, hotel-like presence.",
    image: "/images/categories/beds.jpg",
    order: 5,
  },
  {
    slug: "storage",
    name: "Storage",
    tagline: "Everything has a place",
    description:
      "Credenzas, cabinets and open shelving that keep daily life out of sight while leaving the good objects on show.",
    image: "/images/categories/storage.jpg",
    order: 6,
  },
  {
    slug: "tv-units",
    name: "TV Units",
    tagline: "Technology, softened",
    description:
      "Low media consoles that ground the living room, with cable-friendly proportions and warm timber fronts.",
    image: "/images/categories/tv-units.jpg",
    order: 7,
  },
  {
    slug: "desks",
    name: "Desks",
    tagline: "Room to think",
    description:
      "Writing desks and worktables with slim profiles — quiet enough for a bedroom, composed enough for a studio.",
    image: "/images/categories/desks.jpg",
    order: 8,
  },
  {
    slug: "benches",
    name: "Benches",
    tagline: "The in-between seat",
    description:
      "Dining benches and end-of-bed benches in timber and upholstery, flexible by design and easy to live with.",
    image: "/images/categories/benches.jpg",
    order: 9,
  },
  {
    slug: "outdoor",
    name: "Outdoor",
    tagline: "Living, extended",
    description:
      "Weather-honest lounge and dining pieces that carry the same warmth from the interior out onto the terrace.",
    image: "/images/categories/outdoor.jpg",
    order: 10,
  },
];

export const getCategory = (slug: string) =>
  categories.find((category) => category.slug === slug);
