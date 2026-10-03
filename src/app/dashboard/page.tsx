import Link from "next/link";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { countProducts } from "@/lib/server/repositories/products.repository";
import { listCategories } from "@/lib/server/repositories/categories.repository";
import { listCollections } from "@/lib/server/repositories/collections.repository";
import { listDepartments } from "@/lib/server/repositories/departments.repository";
import { listMediaAssets } from "@/lib/server/repositories/media.repository";
import { listSettings } from "@/lib/server/repositories/settings.repository";

import DbUnavailable, { SectionError } from "./_components/states";

export const metadata = {
  title: "Dashboard",
  description: "Hype admin overview.",
};

interface StatCardProps {
  label: string;
  value: number;
  href?: string;
}

function StatCard({ label, value, href }: StatCardProps) {
  const body = (
    <>
      <p className="font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </>
  );
  return (
    <div className="rounded-2xl border border-line bg-canvas p-5">
      {href ? (
        <Link href={href} className="block hover:opacity-80">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

async function loadOverview() {
  try {
    const [total, published, draft, archived, departments, categories, collections, media, settings] =
      await Promise.all([
        countProducts({}),
        countProducts({ status: "PUBLISHED" }),
        countProducts({ status: "DRAFT" }),
        countProducts({ status: "ARCHIVED" }),
        listDepartments(),
        listCategories(),
        listCollections(),
        listMediaAssets({ pageSize: 1 }),
        listSettings(),
      ]);

    const departmentCounts = await Promise.all(
      departments.map(async (department) => ({
        name: department.name,
        count: await countProducts({ departmentSlug: department.slug }),
        isVisible: department.isVisible,
      })),
    );
    return {
      ok: true as const,
      total,
      published,
      draft,
      archived,
      departmentCounts,
      categoryCount: categories.length,
      collectionCount: collections.length,
      mediaTotal: media.total,
      settingsCount: settings.length,
    };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "The overview could not be loaded.",
    };
  }
}

/**
 * Dashboard home. All numbers come from live database queries — nothing is
 * hardcoded or faked. Without DATABASE_URL the queries fail and the page
 * renders the unavailable state instead of invented statistics.
 */
export default async function DashboardHomePage() {
  const loaded = await loadOverview();
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="The dashboard overview" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">Live catalog data from the database.</p>
      </div>

      <section aria-label="Product statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total products" value={loaded.total} href="/dashboard/products" />
        <StatCard label="Published" value={loaded.published} href="/dashboard/products?status=PUBLISHED" />
        <StatCard label="Draft" value={loaded.draft} href="/dashboard/products?status=DRAFT" />
        <StatCard label="Archived" value={loaded.archived} href="/dashboard/products?status=ARCHIVED" />
      </section>

      <section aria-label="Departments" className="rounded-2xl border border-line bg-canvas p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Departments</h2>
          <Link href="/dashboard/departments" className="text-sm font-medium text-ink-soft underline">
            Manage
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {loaded.departmentCounts.length === 0 ? (
            <li className="text-sm text-muted">No departments yet.</li>
          ) : (
            loaded.departmentCounts.map((department) => (
              <li key={department.name} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  {department.name}
                  {!department.isVisible ? <span className="text-muted"> (hidden)</span> : null}
                </span>
                <span className="font-semibold text-ink">{department.count} products</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section aria-label="Catalog breadth" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Categories" value={loaded.categoryCount} href="/dashboard/categories" />
        <StatCard label="Collections" value={loaded.collectionCount} href="/dashboard/collections" />
        <StatCard label="Media assets" value={loaded.mediaTotal} href="/dashboard/media" />
        <StatCard label="Site settings" value={loaded.settingsCount} href="/dashboard/settings" />
      </section>
    </div>
  );
}
