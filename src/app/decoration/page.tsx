import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";
import CategoryTile from "@/components/categories/CategoryTile";
import EditorialSplit from "@/components/editorial/EditorialSplit";
import FullBleed from "@/components/editorial/FullBleed";
import PromoSplit from "@/components/editorial/PromoSplit";
import ProductRail from "@/components/products/ProductRail";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { ArrowRight } from "@/components/ui/Icons";
import {
  decorationHero,
  decorationPairing,
  decorationSections,
} from "@/data/decorationEditorial";
import {
  getBestSellers,
  getFeatured,
  getNewArrivals,
  type SortKey,
} from "@/lib/catalog-ui";
import {
  getPublicCategories,
  getPublicCategoryNameMap,
  getPublicDepartment,
  getPublicProducts,
} from "@/lib/server/public-catalog";

export const metadata: Metadata = {
  title: "Decoration",
  description:
    "Shop Hype Decoration — mirrors, lighting, vases, rugs, wall art, textiles, candles and planters in warm neutrals, filterable by material, colour and price.",
};

export const dynamic = "force-dynamic";

const validSorts: SortKey[] = ["featured", "newest", "price-asc", "price-desc"];

export default async function DecorationPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sortParam = typeof params.sort === "string" ? params.sort : undefined;
  const sort = validSorts.includes(sortParam as SortKey) ? (sortParam as SortKey) : "featured";
  const [department, products, decorationCategories, categoryNames] = await Promise.all([
    getPublicDepartment("decoration"),
    getPublicProducts("decoration"),
    getPublicCategories("decoration"),
    getPublicCategoryNameMap(),
  ]);
  if (!department) notFound();
  const featured = getFeatured(6, products);
  const newArrivals = getNewArrivals(8, products);
  const bestSellers = getBestSellers(8, products);
  const counts: Record<string, number> = {};
  for (const product of products) counts[product.category] = (counts[product.category] ?? 0) + 1;

  return (
    <div className="py-12 md:py-16">
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Decoration" }]} />

        <div className="mt-6 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{decorationHero.eyebrow}</p>
            <h1 className="display-lg mt-4">{decorationHero.title}</h1>
            <p className="lede mt-6 max-w-md">{decorationHero.body}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={decorationHero.primaryCta.href} className="btn btn-solid">
                {decorationHero.primaryCta.label}
                <ArrowRight />
              </Link>
              <Link href={decorationHero.secondaryCta.href} className="btn btn-outline">
                {decorationHero.secondaryCta.label}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-7">
            <div className="frame relative aspect-[4/3] lg:aspect-[16/11]">
              <Image
                src={decorationHero.image}
                alt={decorationHero.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="is-primary object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>

      <section id="categories" className="shell scroll-mt-28 py-16 md:py-24" aria-labelledby="decoration-categories-title">
        <div id="decoration-categories-title">
          <SectionHeading
            eyebrow="Eight families"
            title="Shop by category."
            description="Mirrors, lighting, vessels, rugs, art, textiles, candlelight and planters — each family photographed in the same warm light."
          />
        </div>
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
          {decorationCategories.map((category, index) => (
            <Reveal key={category.slug} delay={(index % 4) * 60}>
              <CategoryTile
                category={category}
                count={counts[category.slug] ?? 0}
                basePath="/decoration"
                priority={index < 2}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell pb-16 md:pb-24" aria-labelledby="decoration-featured-title">
        <div id="decoration-featured-title">
          <SectionHeading
            eyebrow="Selected pieces"
            title="The ones we keep reaching for."
            action={{ label: "All decoration", href: "#collection" }}
          />
        </div>
        <div className="mt-10">
          <ProductRail
            products={featured}
            label="Featured decoration"
            productBasePath="/decoration/product"
            categoryNames={categoryNames}
          />
        </div>
      </section>

      <EditorialSplit block={decorationSections.material} />

      <section className="shell py-16 md:py-24" aria-labelledby="decoration-arrivals-title">
        <div id="decoration-arrivals-title">
          <SectionHeading
            eyebrow="New arrivals"
            title="Just landed in decoration."
            description="The latest vessels, textiles and objects to join the collection."
            action={{ label: "Sort by newest", href: "/decoration?sort=newest#collection" }}
          />
        </div>
        <div className="mt-10">
          <ProductRail
            products={newArrivals}
            label="New decoration arrivals"
            productBasePath="/decoration/product"
            categoryNames={categoryNames}
          />
        </div>
      </section>

      <FullBleed block={decorationSections.fullBleed} label="Hype Decoration — No. 01" />

      <section className="shell py-16 md:py-24" aria-labelledby="decoration-bestsellers-title">
        <div id="decoration-bestsellers-title">
          <SectionHeading
            eyebrow="Best sellers"
            title="The pieces people keep recommending."
            action={{ label: "All decoration", href: "#collection" }}
          />
        </div>
        <div className="mt-10">
          <ProductRail
            products={bestSellers}
            label="Bestselling decoration"
            ratio="tall"
            productBasePath="/decoration/product"
            categoryNames={categoryNames}
          />
        </div>
      </section>

      <section id="collection" className="shell scroll-mt-28 pb-4" aria-labelledby="decoration-collection-title">
        <div id="decoration-collection-title">
          <SectionHeading
            eyebrow="The full collection"
            title="Every piece, one shelf."
            description="Filter by material, colour, availability or price — the same tools as the furniture collection."
          />
        </div>
        <div className="mt-10">
          <CatalogExplorer
            products={products}
            initialSort={sort}
            categories={decorationCategories}
            allLabel="All decoration"
            productBasePath="/decoration/product"
          />
        </div>
      </section>

      <div className="mt-16 md:mt-24">
        <PromoSplit
          eyebrow={decorationPairing.eyebrow}
          title={decorationPairing.title}
          body={decorationPairing.body}
          image={decorationPairing.image}
          imageAlt={decorationPairing.imageAlt}
          cta={decorationPairing.cta}
          reverse
        />
      </div>
    </div>
  );
}
