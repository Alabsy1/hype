export type Availability = "in-stock" | "low-stock" | "made-to-order";

export type Department = "furniture" | "decoration";

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
  unit: "cm" | "in";
}

export interface Product {
  id: string;
  name: string;
  category: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  shortDescription: string;
  images: string[];
  thumbnail?: string;
  dimensions: ProductDimensions;
  material: string;
  color: string;
  availability: Availability;
  comparisonGroup: string;
  tags: string[];
  features: string[];
  alternatives: string[];
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  /**
   * Catalog department. Omitted on legacy furniture entries, which resolve to
   * "furniture" via catalog helpers — set explicitly on decoration entries so
   * shared components can route, search and compare across both catalogs.
   * Mirrors the future CMS `department` / visibility field.
   */
  department?: Department;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  order: number;
  /** Catalog department; omitted on legacy furniture entries (= "furniture"). */
  department?: Department;
}

export interface Collection {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  products: string[];
}

export interface EditorialBlock {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  image: string;
  imageAlt: string;
  secondaryImage?: string;
  secondaryImageAlt?: string;
}
