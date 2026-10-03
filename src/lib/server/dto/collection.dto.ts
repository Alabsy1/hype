import "server-only";

export interface CollectionDTO {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string | null;
  isVisible: boolean;
  productCount: number;
}

export interface CollectionShape {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string | null;
  isVisible: boolean;
  _count?: { products: number };
}

export function toCollectionDTO(collection: CollectionShape): CollectionDTO {
  return {
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    eyebrow: collection.eyebrow,
    description: collection.description,
    isVisible: collection.isVisible,
    productCount: collection._count?.products ?? 0,
  };
}