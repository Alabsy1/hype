import "server-only";

export interface CategoryDTO {
  id: string;
  departmentId: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageId: string | null;
  order: number;
  isVisible: boolean;
  productCount: number;
}

export interface CategoryWithCountShape {
  id: string;
  departmentId: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageId: string | null;
  order: number;
  isVisible: boolean;
  _count?: { products: number };
}

export function toCategoryDTO(category: CategoryWithCountShape): CategoryDTO {
  return {
    id: category.id,
    departmentId: category.departmentId,
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    description: category.description,
    imageId: category.imageId,
    order: category.order,
    isVisible: category.isVisible,
    productCount: category._count?.products ?? 0,
  };
}