import Image from "next/image";
import Link from "next/link";
import { availabilityLabel, formatPrice } from "@/lib/catalog-ui";
import type { Product } from "@/data/types";

const ratios = {
  portrait: "aspect-[4/5]",
  tall: "aspect-[3/4]",
  square: "aspect-square",
  wide: "aspect-[5/4]",
  landscape: "aspect-[4/3]",
} as const;

export type CardRatio = keyof typeof ratios;

interface ProductCardProps {
  product: Product;
  ratio?: CardRatio;
  priority?: boolean;
  showSecondary?: boolean;
  sizes?: string;
  /** Route prefix for the product detail page. Defaults to the furniture catalog. */
  productBasePath?: string;
  /** Display name of the product's category (resolved server-side from the DB). */
  categoryName: string;
}

export default function ProductCard({
  product,
  ratio = "portrait",
  priority = false,
  showSecondary = true,
  sizes = "(max-width: 768px) 70vw, (max-width: 1200px) 33vw, 24vw",
  productBasePath = "/furniture/product",
  categoryName,
}: ProductCardProps) {
  const badge = product.newArrival
    ? "New"
    : product.bestseller
      ? "Bestseller"
      : product.compareAtPrice
        ? "Offer"
        : null;

  return (
    <article className="group">
      <Link href={`${productBasePath}/${product.slug}`} className="block focus-visible:outline-offset-4">
        <div className={`frame relative ${ratios[ratio]}`}>
          <Image
            src={product.images[0]}
            alt={`${product.name} — ${product.shortDescription}`}
            fill
            sizes={sizes}
            priority={priority}
            className="is-primary object-cover"
          />
          {showSecondary && product.images[1] ? (
            <Image
              src={product.images[1]}
              alt=""
              aria-hidden="true"
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          ) : null}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {badge ? (
              <span className="bg-canvas/95 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-ink">
                {badge}
              </span>
            ) : null}

            {product.availability === "made-to-order" ? (
              <span className="bg-ink/85 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-canvas">
                Made to order
              </span>
            ) : null}
          </div>

          <span className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-between bg-canvas/92 px-3 py-2 text-[0.68rem] uppercase tracking-[0.18em] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <span>View piece</span>
            <span aria-hidden="true">→</span>
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[0.98rem] font-normal leading-snug tracking-tight">{product.name}</h3>
            <p className="meta mt-1.5 normal-case tracking-[0.08em]">
              {categoryName} · {product.material.split(",")[0]}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.95rem] tabular-nums">{formatPrice(product.price)}</p>
            {product.compareAtPrice ? (
              <p className="text-[0.72rem] text-muted line-through tabular-nums">
                {formatPrice(product.compareAtPrice)}
              </p>
            ) : (
              <p className="text-[0.72rem] text-muted">{availabilityLabel[product.availability]}</p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
