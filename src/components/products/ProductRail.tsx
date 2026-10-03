"use client";

import { useRef } from "react";
import ProductCard, { type CardRatio } from "./ProductCard";
import { ArrowLeft, ArrowRight } from "@/components/ui/Icons";
import type { Product } from "@/data/types";

interface ProductRailProps {
  products: Product[];
  ratio?: CardRatio;
  label?: string;
  productBasePath?: string;
  /** Category display names by category slug (resolved server-side from the DB). */
  categoryNames: Record<string, string>;
}

export default function ProductRail({
  products,
  ratio = "portrait",
  label,
  productBasePath,
  categoryNames,
}: ProductRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.72, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={railRef}
        role="group"
        aria-label={label ?? "Product carousel"}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-1 md:mx-0 md:gap-7 md:px-0"
      >
        {products.map((product) => (
          <div
            key={product.slug}
            className="w-[74vw] shrink-0 snap-start sm:w-[46vw] lg:w-[23vw]"
          >
            <ProductCard
              product={product}
              ratio={ratio}
              sizes="(max-width: 768px) 74vw, (max-width: 1200px) 46vw, 23vw"
              productBasePath={productBasePath}
              categoryName={categoryNames[product.category] ?? product.category}
            />
          </div>
        ))}
      </div>

      <div className="mt-7 hidden items-center justify-end gap-2 md:flex">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll collection backwards"
          className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
        >
          <ArrowLeft />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll collection forwards"
          className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
