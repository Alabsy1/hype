import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Reveal from "@/components/ui/Reveal";
import ProductRail from "@/components/products/ProductRail";
import { ArrowRight } from "@/components/ui/Icons";
import { getPublicCategoryNameMap, getPublicCollections } from "@/lib/server/public-catalog";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Curated edits from the Hype studio — new arrivals, the living-room composition, best sellers and the quiet-mornings bedroom set.",
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const [collections, categoryNames] = await Promise.all([
    getPublicCollections(),
    getPublicCategoryNameMap(),
  ]);

  return (
    <div className="shell py-12 md:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />

      <header className="mt-6 grid gap-6 border-b border-line pb-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Curated edits</p>
          <h1 className="display-lg mt-4">Four ways into the collection.</h1>
        </div>
        <p className="lede lg:col-span-5 lg:pt-9">
          Each collection is a composition, not a filter — pieces chosen to sit next to each other,
          with the reasoning written down.
        </p>
      </header>

      <div className="space-y-16 pt-12 md:space-y-24">
        {collections.map((entry, index) => {
          const { collection, products: items } = entry;
          return (
            <Reveal key={collection.slug} delay={60}>
              <section aria-labelledby={`collection-${collection.slug}`}>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <p className="eyebrow">{collection.eyebrow}</p>
                    <h2
                      id={`collection-${collection.slug}`}
                      className="display-md mt-4 flex items-baseline gap-4"
                    >
                      {collection.name}
                      <span className="meta tabular-nums text-muted">
                        {String(index + 1).padStart(2, "0")} / {String(collections.length).padStart(2, "0")}
                      </span>
                    </h2>
                    <p className="lede mt-4 max-w-xl">{collection.description}</p>
                  </div>

                  <Link
                    href={`/furniture?sort=${collection.slug === "new-arrivals" ? "newest" : "featured"}`}
                    className="link-underline meta inline-flex shrink-0 items-center gap-2 text-ink hover:text-accent"
                  >
                    Shop the edit
                    <ArrowRight />
                  </Link>
                </div>

                <div className="mt-8">
                  <ProductRail products={items} label={`${collection.name} collection`} categoryNames={categoryNames} />
                </div>
              </section>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
