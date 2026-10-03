"use client";

import ProductCard from "@/components/products/ProductCard";
import { CompareToggle } from "@/components/products/CompareToggle";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Product } from "@/data/types";

interface AlternativesSectionProps {
  product: Product;
  alternatives: Product[];
  productBasePath?: string;
  /** Category display names by category slug (resolved server-side from the DB). */
  categoryNames: Record<string, string>;
}

export default function AlternativesSection({
  product,
  alternatives,
  productBasePath,
  categoryNames,
}: AlternativesSectionProps) {
  if (!alternatives.length) return null;

  return (
    <section className="shell py-16 md:py-24" aria-labelledby="alternatives-title">
      <div id="alternatives-title">
        <SectionHeading
          eyebrow="Alternatives"
          title={`How ${product.name} compares.`}
          description={`Line the ${product.name} up against ${alternatives.length} alternatives — dimensions, material and price side by side.`}
        />
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-7 lg:grid-cols-4">
        {alternatives.map((alternative, index) => (
          <Reveal key={alternative.slug} delay={index * 60} className="flex flex-col">
            <ProductCard
              product={alternative}
              ratio="portrait"
              sizes="(max-width: 768px) 45vw, 24vw"
              productBasePath={productBasePath}
              categoryName={categoryNames[alternative.category] ?? alternative.category}
            />
            <div className="mt-4">
              <CompareToggle slug={alternative.slug} compact />
            </div>
          </Reveal>
        ))}
      </div>

      <p className="meta mt-10 normal-case tracking-[0.1em] text-muted">
        Select up to four pieces, then open the comparison table to see them aligned.
      </p>
    </section>
  );
}
