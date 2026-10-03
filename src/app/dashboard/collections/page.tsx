import Link from "next/link";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { listCollections } from "@/lib/server/repositories/collections.repository";

import { VisibilityBadge } from "../_components/badges";
import DbUnavailable, { EmptyState, SectionError } from "../_components/states";

export const metadata = {
  title: "Collections",
  description: "Manage Hype collections.",
};

async function loadCollections() {
  try {
    return { ok: true as const, collections: await listCollections() };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "Collections could not be loaded.",
    };
  }
}

export default async function CollectionsPage() {
  const loaded = await loadCollections();
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Collection management" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { collections } = loaded;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Collections</h1>
          <p className="mt-1 text-sm text-muted">{collections.length} collections.</p>
        </div>
        <Link
          href="/dashboard/collections/new"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas"
        >
          + New collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <EmptyState title="No collections yet." hint="Create the first curated product set." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <li key={collection.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-canvas p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {collection.eyebrow}
                  </p>
                  <p className="truncate font-medium text-ink">{collection.name}</p>
                </div>
                <VisibilityBadge isVisible={collection.isVisible} />
              </div>
              <p className="text-xs text-muted">
                {collection.slug} · {collection.productCount} products
              </p>
              <div>
                <Link
                  href={`/dashboard/collections/${collection.id}`}
                  className="inline-block rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink"
                >
                  Manage
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
