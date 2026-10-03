// Pure public-catalog presentation contracts. Client-safe: this module must
// NEVER import runtime data (`@/data/*`) or server code — only types (erased
// at compile time). All list operations take explicit arrays so server
// components can pass database-backed data while client components keep
// identical filtering/sorting/search behavior.

import type { Availability, Category, Department, Product } from "@/data/types";

export type { Availability, Category, Department, Product };

export const getProductDepartment = (product: Product): Department =>
  product.department ?? "furniture";

export const getProductPath = (product: Product) =>
  `/${getProductDepartment(product)}/product/${product.slug}`;

export const getCategoryPath = (category: Category) =>
  `/${category.department ?? "furniture"}/${category.slug}`;

export const getProductBySlug = (slug: string, list: Product[]) =>
  list.find((product) => product.slug === slug);

export const getProductsByCategory = (category: string, list: Product[]) =>
  list.filter((product) => product.category === category);

export const getAlternatives = (product: Product, list: Product[]) =>
  product.alternatives
    .map((slug) => getProductBySlug(slug, list))
    .filter((item): item is Product => Boolean(item));

export const getRelated = (product: Product, limit = 4, list: Product[]) => {
  const sameGroup = list.filter(
    (item) => item.comparisonGroup === product.comparisonGroup && item.slug !== product.slug,
  );
  const others = list.filter(
    (item) => item.category !== product.category && item.slug !== product.slug,
  );
  return [...sameGroup, ...others].slice(0, limit);
};

export const getBySlugs = (slugs: string[], list: Product[]) =>
  slugs
    .map((slug) => getProductBySlug(slug, list))
    .filter((item): item is Product => Boolean(item));

export const getFeatured = (limit = 6, list: Product[]) =>
  list.filter((product) => product.featured).slice(0, limit);

export const getNewArrivals = (limit = 8, list: Product[]) =>
  list.filter((product) => product.newArrival).slice(0, limit);

export const getBestSellers = (limit = 8, list: Product[]) =>
  list.filter((product) => product.bestseller).slice(0, limit);

export const getRecentlyAdded = (limit = 8, list: Product[]) =>
  [...list].reverse().slice(0, limit);

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export interface CatalogFilters {
  category?: string;
  materials: string[];
  colors: string[];
  colorFamilies: string[];
  availability: Availability[];
  price: string;
}

export const emptyFilters: CatalogFilters = {
  category: undefined,
  materials: [],
  colors: [],
  colorFamilies: [],
  availability: [],
  price: "all",
};

export const priceBands = [
  { key: "all", label: "Any price", min: 0, max: Infinity },
  { key: "u1000", label: "Under $1,000", min: 0, max: 1000 },
  { key: "1000-2000", label: "$1,000 – $2,000", min: 1000, max: 2000 },
  { key: "2000-3500", label: "$2,000 – $3,500", min: 2000, max: 3500 },
  { key: "o3500", label: "$3,500 and above", min: 3500, max: Infinity },
] as const;

export const availabilityLabel: Record<Availability, string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "made-to-order": "Made to order",
};

export const materialFamilies = [
  "Bouclé",
  "Linen",
  "Leather",
  "Wool",
  "Rattan",
  "Oak",
  "Walnut",
  "Ash",
  "Stone",
  "Steel",
  "Teak",
  "Aluminium",
  "Glass",
  "Ceramic",
  "Cotton",
  "Brass",
];

const matchesMaterial = (product: Product, family: string) =>
  product.material.toLowerCase().includes(family.toLowerCase());

export const colorFamilies = ["Light neutrals", "Warm browns", "Wood tones", "Dark"] as const;

export const getColorFamily = (color: string): string => {
  const value = color.toLowerCase();
  if (value.includes("charcoal") || value.includes("black")) return "Dark";
  if (["oak", "ash", "teak", "walnut"].some((word) => value.includes(word)))
    return "Wood tones";
  if (["cognac", "taupe", "bronze", "natural"].some((word) => value.includes(word)))
    return "Warm browns";
  return "Light neutrals";
};

const inBand = (price: number, key: string) => {
  const band = priceBands.find((item) => item.key === key) ?? priceBands[0];
  return price >= band.min && price < band.max;
};

export const filterProducts = (
  list: Product[],
  filters: CatalogFilters,
  sort: SortKey,
) => {
  const filtered = list.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.materials.length && !filters.materials.some((family) => matchesMaterial(product, family)))
      return false;
    if (filters.colors.length && !filters.colors.includes(product.color)) return false;
    if (
      filters.colorFamilies.length &&
      !filters.colorFamilies.includes(getColorFamily(product.color))
    )
      return false;
    if (filters.availability.length && !filters.availability.includes(product.availability))
      return false;
    if (filters.price !== "all" && !inBand(product.price, filters.price)) return false;
    return true;
  });

  switch (sort) {
    case "price-asc":
      return [...filtered].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...filtered].sort((a, b) => b.price - a.price);
    case "newest":
      return [...filtered].sort(
        (a, b) =>
          Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival)) ||
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      );
    case "featured":
    default:
      return [...filtered].sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
      );
  }
};

export const getFilterOptions = (list: Product[]) => ({
  materials: materialFamilies.filter((family) => list.some((product) => matchesMaterial(product, family))),
  colors: [...new Set(list.map((product) => product.color))].sort(),
  colorFamilies: colorFamilies.filter((family) =>
    list.some((product) => getColorFamily(product.color) === family),
  ),
  availability: [...new Set(list.map((product) => product.availability))] as Availability[],
});

export interface CatalogSearchScope {
  products?: Product[];
  categories?: Category[];
}

export const searchCatalog = (query: string, scope: CatalogSearchScope = {}) => {
  const productList = scope.products ?? [];
  const categoryList = scope.categories ?? [];
  const term = query.trim().toLowerCase();
  if (!term) return { products: [] as Product[], categories: categoryList.slice(0, 4) };

  const matchedProducts = productList.filter((product) => {
    const haystack = [
      product.name,
      product.category,
      product.material,
      product.color,
      product.shortDescription,
      ...product.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  const matchedCategories = categoryList.filter((category) =>
    [category.name, category.tagline, category.description].join(" ").toLowerCase().includes(term),
  );

  return { products: matchedProducts, categories: matchedCategories };
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const getCategoryCount = (slug: string, list: Product[]) =>
  getProductsByCategory(slug, list).length;
