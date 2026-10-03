import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getPublicCategories, getPublicDepartment, getPublicProducts } from "@/lib/server/public-catalog";
import type { SortKey } from "@/lib/catalog-ui";

export const metadata: Metadata = {
  title: "Furniture",
  description:
    "Browse the full Hype collection — sofas, chairs, tables, beds, storage, desks, benches and outdoor pieces, filterable by material, colour and price.",
};

export const dynamic = "force-dynamic";

const validSorts: SortKey[] = ["featured", "newest", "price-asc", "price-desc"];

export default async function FurniturePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sortParam = typeof params.sort === "string" ? params.sort : undefined;
  const sort = validSorts.includes(sortParam as SortKey) ? (sortParam as SortKey) : "featured";
  const [department, products, categories] = await Promise.all([
    getPublicDepartment("furniture"),
    getPublicProducts("furniture"),
    getPublicCategories("furniture"),
  ]);
  if (!department) notFound();

  return (
    <div className="shell py-12 md:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Furniture" }]} />

      <header className="mt-6 grid gap-6 border-b border-line pb-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">The collection</p>
          <h1 className="display-lg mt-4">All furniture</h1>
        </div>
        <p className="lede lg:col-span-5 lg:pt-9">
          Twenty-four pieces across ten categories, photographed and described the same way so you
          can move between rooms without relearning anything.
        </p>
      </header>

      <div className="mt-10">
        <CatalogExplorer products={products} initialSort={sort} categories={categories} />
      </div>
    </div>
  );
}
