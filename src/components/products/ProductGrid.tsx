import ProductCard, { type CardRatio } from "./ProductCard";
import type { Product } from "@/data/types";

interface ProductGridProps {
  products: Product[];
  ratios?: CardRatio[];
  className?: string;
  sizes?: string;
  productBasePath?: string;
  /** Category display names by category slug (resolved server-side from the DB). */
  categoryNames: Record<string, string>;
}

export default function ProductGrid({
  products,
  ratios = ["portrait", "tall", "portrait", "wide", "square", "portrait"],
  className = "",
  sizes = "(max-width: 768px) 45vw, (max-width: 1200px) 31vw, 23vw",
  productBasePath,
  categoryNames,
}: ProductGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 md:gap-x-7 ${className}`}>
      {products.map((product, index) => (
        <ProductCard
          key={product.slug}
          product={product}
          ratio={ratios[index % ratios.length]}
          sizes={sizes}
          productBasePath={productBasePath}
          categoryName={categoryNames[product.category] ?? product.category}
        />
      ))}
    </div>
  );
}
