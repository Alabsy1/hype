import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AlternativesSection from "@/components/products/AlternativesSection";
import ProductGallery from "@/components/products/ProductGallery";
import ProductRail from "@/components/products/ProductRail";
import { CompareToggle } from "@/components/products/CompareToggle";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { availabilityLabel, formatPrice } from "@/lib/catalog-ui";
import { getPublicCategoryNameMap, getPublicProductDetail } from "@/lib/server/public-catalog";

interface ProductParams {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductParams): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPublicProductDetail("decoration", slug);
  if (!detail) return { title: "Piece not found" };

  return {
    title: detail.product.name,
    description: detail.product.shortDescription,
  };
}

export default async function DecorationProductPage({ params }: ProductParams) {
  const { slug } = await params;
  const [detail, categoryNames] = await Promise.all([
    getPublicProductDetail("decoration", slug),
    getPublicCategoryNameMap(),
  ]);
  if (!detail) notFound();
  const { product, categoryName, alternatives, related } = detail;

  const specs: { label: string; value: string }[] = [
    {
      label: "Dimensions",
      value: `${product.dimensions.width} × ${product.dimensions.depth} × ${product.dimensions.height} ${product.dimensions.unit}`,
    },
    { label: "Material", value: product.material },
    { label: "Colour", value: product.color },
    { label: "Availability", value: availabilityLabel[product.availability] },
    { label: "Category", value: categoryName },
    { label: "Tags", value: product.tags.join(", ") },
  ];

  return (
    <div className="py-12 md:py-16">
      <div className="shell">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Decoration", href: "/decoration" },
            { label: categoryName, href: `/decoration/${product.category}` },
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">{categoryName}</p>
              <h1 className="display-md mt-4">{product.name}</h1>

              <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <p className="text-2xl tabular-nums">{formatPrice(product.price)}</p>
                {product.compareAtPrice ? (
                  <p className="text-sm text-muted line-through tabular-nums">
                    {formatPrice(product.compareAtPrice)}
                  </p>
                ) : null}
                <p className="meta text-ink-soft">{availabilityLabel[product.availability]}</p>
              </div>

              <p className="lede mt-6">{product.shortDescription}</p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{product.description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-solid"
                  title="Cart and checkout arrive in release 02"
                >
                  Add to cart
                </button>
                <CompareToggle slug={product.slug} />
              </div>
              <p className="meta mt-3 normal-case tracking-[0.1em] text-muted">
                Cart and checkout arrive in the next release — comparison works right now.
              </p>

              <dl className="mt-10 border-t border-line">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-3.5"
                  >
                    <dt className="meta shrink-0 text-muted">{spec.label}</dt>
                    <dd className="text-right text-sm text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-8 space-y-2.5">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-baseline gap-3 text-sm text-ink-soft">
                    <span aria-hidden="true" className="text-accent">
                      ✳
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <p className="meta mt-8 normal-case tracking-[0.1em] text-muted">
                Inspected before it leaves the studio, and delivered with care.{" "}
                <Link href="/about" className="link-underline text-ink">
                  About the studio
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <AlternativesSection
        product={product}
        alternatives={alternatives}
        productBasePath="/decoration/product"
        categoryNames={categoryNames}
      />

      <section className="pb-4" aria-labelledby="related-title">
        <div className="shell">
          <div id="related-title" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Also consider</p>
              <h2 className="display-sm mt-4">Pieces that sit well together.</h2>
            </div>
            <Link href="/decoration" className="link-underline meta text-ink hover:text-accent">
              All decoration
            </Link>
          </div>
        </div>
        <div className="shell mt-8">
          <ProductRail
            products={related}
            label="Related pieces"
            productBasePath="/decoration/product"
            categoryNames={categoryNames}
          />
        </div>
      </section>
    </div>
  );
}
