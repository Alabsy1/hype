import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getPublicCategories, getPublicProductsByCategory } from "@/lib/server/public-catalog";

interface CategoryParams {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryParams): Promise<Metadata> {
  const { category: slug } = await params;
  const result = await getPublicProductsByCategory("decoration", slug);
  if (!result) return { title: "Decoration" };

  return {
    title: `${result.category.name} — ${result.category.tagline}`,
    description: result.category.description,
  };
}

const validSorts = ["featured", "newest", "price-asc", "price-desc"] as const;

export default async function DecorationCategoryPage({ params, searchParams }: CategoryParams) {
  const [{ category: slug }, resolved] = await Promise.all([params, searchParams]);
  const [result, decorationCategories] = await Promise.all([
    getPublicProductsByCategory("decoration", slug),
    getPublicCategories("decoration"),
  ]);
  if (!result) notFound();

  const sortParam = typeof resolved.sort === "string" ? resolved.sort : undefined;
  const sort = validSorts.includes(sortParam as (typeof validSorts)[number])
    ? (sortParam as (typeof validSorts)[number])
    : "featured";

  const { category, products } = result;
  const siblings = decorationCategories.filter((item) => item.slug !== category.slug).slice(0, 5);

  return (
    <div className="py-12 md:py-16">
      <div className="shell">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Decoration", href: "/decoration" },
            { label: category.name },
          ]}
        />

        <header className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">{category.tagline}</p>
            <h1 className="display-lg mt-4">{category.name}</h1>
            <p className="lede mt-6 max-w-md">{category.description}</p>
            <p className="meta mt-8 normal-case tracking-[0.1em]">
              {products.length} {products.length === 1 ? "piece" : "pieces"} in this category
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="frame aspect-[16/9] lg:aspect-[16/10]">
              <Image
                src={category.image}
                alt={`${category.name} from the Hype decoration collection`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>
        </header>

        <nav aria-label="Other categories" className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          {siblings.map((item) => (
            <Link
              key={item.slug}
              href={`/decoration/${item.slug}`}
              className="link-underline meta text-ink-soft hover:text-ink"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-12">
          <CatalogExplorer
            products={products}
            initialCategory={category.slug}
            initialSort={sort}
            showCategoryFilter={false}
            categories={decorationCategories}
            allLabel="All decoration"
            productBasePath="/decoration/product"
          />
        </div>
      </div>
    </div>
  );
}
