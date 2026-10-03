import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import Ticker from "@/components/home/Ticker";
import CategoryBento from "@/components/home/CategoryBento";
import EditorialSplit from "@/components/editorial/EditorialSplit";
import FullBleed from "@/components/editorial/FullBleed";
import PromoSplit from "@/components/editorial/PromoSplit";
import ProductCard from "@/components/products/ProductCard";
import ProductGrid from "@/components/products/ProductGrid";
import ProductRail from "@/components/products/ProductRail";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { ArrowRight } from "@/components/ui/Icons";
import { editorialSections } from "@/data/editorial";
import {
  getBestSellers,
  getFeatured,
  getNewArrivals,
} from "@/lib/catalog-ui";
import {
  getHomepageFeaturedDepartment,
} from "@/lib/server/homepage";
import {
  getPublicCategories,
  getPublicCategoryNameMap,
  getPublicCollection,
  getPublicProducts,
} from "@/lib/server/public-catalog";
import type { CardRatio } from "@/components/products/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [livingRoom, furnitureProducts, decorationProducts, furnitureCategories, categoryNames, featuredDepartment] = await Promise.all([
    getPublicCollection("living-room"),
    getPublicProducts("furniture"),
    getPublicProducts("decoration"),
    getPublicCategories("furniture"),
    getPublicCategoryNameMap(),
    getHomepageFeaturedDepartment(),
  ]);
  // The featured section keeps its curated living-room collection for
  // Furniture (unchanged behavior); Decoration shows its featured-flagged
  // products through the same slots. Both pools are PUBLISHED-only by
  // construction of the public-catalog service.
  const featured = featuredDepartment === "decoration"
    ? getFeatured(6, decorationProducts)
    : (livingRoom?.products ?? []);
  const newArrivals = getNewArrivals(8, furnitureProducts);
  const bestSellers = getBestSellers(8, furnitureProducts);
  const editorsPicks = getFeatured(6, furnitureProducts);
  const counts: Record<string, number> = {};
  for (const product of furnitureProducts) counts[product.category] = (counts[product.category] ?? 0) + 1;

  const asymmetric: { index: number; ratio: CardRatio; className: string; sizes: string }[] = [
    { index: 0, ratio: "tall", className: "col-span-2 md:col-span-5", sizes: "(max-width: 768px) 92vw, 40vw" },
    { index: 1, ratio: "portrait", className: "col-span-1 md:col-span-4 md:col-start-7 md:mt-16", sizes: "(max-width: 768px) 45vw, 32vw" },
    { index: 2, ratio: "square", className: "col-span-1 md:col-span-3 md:mt-32", sizes: "(max-width: 768px) 45vw, 23vw" },
    { index: 3, ratio: "portrait", className: "col-span-1 md:col-span-3", sizes: "(max-width: 768px) 45vw, 23vw" },
    { index: 4, ratio: "landscape", className: "col-span-1 md:col-span-4 md:mt-14", sizes: "(max-width: 768px) 45vw, 32vw" },
    { index: 5, ratio: "wide", className: "col-span-2 md:col-span-4 md:col-start-9 md:-mt-8", sizes: "(max-width: 768px) 92vw, 32vw" },
  ];

  return (
    <>
      <Hero />
      <Ticker />

      <section className="shell py-16 md:py-24" aria-labelledby="featured-title">
        <div id="featured-title">
          <SectionHeading
            eyebrow="Featured collection"
            title="Designed for the way you live."
            description="A living-room edit built on deep seats, low tables and surfaces that take a beating gracefully. Hover a piece to see it twice."
            action={{ label: "See the full edit", href: "/collections" }}
          />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-12 md:gap-x-7">
          {asymmetric.map((item, order) => {
            const product = featured[item.index];
            if (!product) return null;
            return (
              <Reveal key={product.slug} delay={order * 60} className={item.className}>
                <ProductCard product={product} ratio={item.ratio} sizes={item.sizes} priority={order === 0} productBasePath={featuredDepartment === "decoration" ? "/decoration/product" : "/furniture/product"} categoryName={categoryNames[product.category] ?? product.category} />
              </Reveal>
            );
          })}
        </div>
      </section>

      <div className="bg-canvas-deep">
        <CategoryBento categories={furnitureCategories} counts={counts} />
      </div>

      <EditorialSplit block={editorialSections.slowMornings} />

      <section className="pb-16 md:pb-24" aria-labelledby="arrivals-title">
        <div className="shell">
          <div id="arrivals-title">
            <SectionHeading
              eyebrow="New arrivals"
              title="Fresh from the workshop."
              description="Eight pieces added to the collection this season, from a swivel chair to a bench for the end of the bed."
              action={{ label: "Browse new pieces", href: "/furniture?sort=newest" }}
            />
          </div>
        </div>
        <div className="shell mt-10">
          <ProductRail products={newArrivals} label="New arrivals" categoryNames={categoryNames} />
        </div>
      </section>

      <EditorialSplit block={editorialSections.craft} layout="stacked" tone="surface" reverse />

      <section className="shell py-16 md:py-24" aria-labelledby="collage-title">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">{editorialSections.collage.eyebrow}</p>
            <h2 id="collage-title" className="display-lg mt-5">
              {editorialSections.collage.title}
            </h2>
            <p className="lede mt-6 max-w-sm">{editorialSections.collage.body}</p>
            {editorialSections.collage.cta ? (
              <Link href={editorialSections.collage.cta.href} className="btn btn-outline mt-8">
                {editorialSections.collage.cta.label}
                <ArrowRight />
              </Link>
            ) : null}
          </Reveal>

          <div className="grid gap-5 lg:col-span-8 lg:grid-cols-3 lg:gap-6">
            <Reveal delay={60} className="lg:mt-10">
              <div className="frame aspect-[3/4]">
                <Image
                  src={editorialSections.collage.image}
                  alt={editorialSections.collage.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 24vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="frame aspect-square lg:mt-20">
                <Image
                  src={editorialSections.collage.secondaryImage ?? editorialSections.collage.image}
                  alt={editorialSections.collage.secondaryImageAlt ?? ""}
                  fill
                  sizes="(max-width: 1024px) 90vw, 24vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={180} className="lg:mt-4">
              <div className="frame aspect-[4/5] lg:aspect-[3/4]">
                <Image
                  src="/images/editorial/collage-3.jpg"
                  alt="Dried grasses and vessels in a dark, moody interior"
                  fill
                  sizes="(max-width: 1024px) 90vw, 24vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <FullBleed block={editorialSections.fullBleed} label="Hype Editions — No. 01" />

      <section className="shell py-16 md:py-24" aria-labelledby="bestsellers-title">
        <div id="bestsellers-title">
          <SectionHeading
            eyebrow="Best sellers"
            title="The pieces people keep recommending."
            action={{ label: "Shop all furniture", href: "/furniture" }}
          />
        </div>
        <div className="mt-10">
          <ProductRail products={bestSellers} label="Best sellers" ratio="tall" categoryNames={categoryNames} />
        </div>
      </section>

      <PromoSplit
        eyebrow={editorialSections.comparePromo.eyebrow}
        title={editorialSections.comparePromo.title}
        body={editorialSections.comparePromo.body}
        image={editorialSections.comparePromo.image}
        imageAlt={editorialSections.comparePromo.imageAlt}
        cta={editorialSections.comparePromo.cta}
        points={[
          "Image, price and availability in one row",
          "Dimensions, material and colour side by side",
          "Feature lists aligned so differences stand out",
          "Up to four pieces at a time",
        ]}
        tone="deep"
        reverse
      />

      <section className="shell py-16 md:py-24" aria-labelledby="picks-title">
        <div id="picks-title">
          <SectionHeading
            eyebrow="Editors' picks"
            title="Where we would start."
            description="If you are furnishing a room from nothing, begin with one of these — they sit comfortably next to almost everything else in the collection."
            action={{ label: "Compare pieces", href: "/compare" }}
          />
        </div>
        <div className="mt-12">
          <ProductGrid products={editorsPicks} categoryNames={categoryNames} />
        </div>
      </section>

      <PromoSplit
        eyebrow="Category 02"
        title="Decoration has arrived."
        body="Vessels, textiles, lighting and objects — the quiet layer that makes a room feel finished. The new Decoration collection, in the same warm neutrals."
        image="/images/decoration/categories/vases.webp"
        imageAlt="Hand-finished ceramic vessels in warm neutral tones"
        cta={{ label: "Explore Decoration", href: "/decoration" }}
      />
    </>
  );
}
