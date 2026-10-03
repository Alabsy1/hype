import type { Metadata } from "next";
import CompareTable from "@/components/compare/CompareTable";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getPublicProducts } from "@/lib/server/public-catalog";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Line up to four Hype pieces side by side — price, dimensions, material, colour, availability and features in one table.",
};

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  // Full published catalog (both departments) for slug resolution and
  // suggestions. Selection state itself stays in the browser (CompareProvider).
  const [furnitureProducts, decorationProducts] = await Promise.all([
    getPublicProducts("furniture"),
    getPublicProducts("decoration"),
  ]);

  return (
    <div className="shell py-12 md:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Compare" }]} />

      <header className="mt-6 grid gap-6 border-b border-line pb-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Before you decide</p>
          <h1 className="display-lg mt-4">Compare with alternatives.</h1>
        </div>
        <p className="lede lg:col-span-5 lg:pt-9">
          Your selection lives in this browser only — no account, no server. Add pieces from any
          product page and read them across one aligned table.
        </p>
      </header>

      <div className="mt-10">
        <CompareTable products={[...furnitureProducts, ...decorationProducts]} />
      </div>
    </div>
  );
}
