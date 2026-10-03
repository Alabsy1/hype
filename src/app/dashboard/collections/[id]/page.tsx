import Link from "next/link";
import { notFound } from "next/navigation";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import {
  getAllCollectionProducts,
  listCollections,
} from "@/lib/server/repositories/collections.repository";
import { listProducts } from "@/lib/server/repositories/products.repository";

import { VisibilityBadge } from "../../_components/badges";
import { Field, TextInput } from "../../_components/form-controls";
import DbUnavailable, { EmptyState, SectionError } from "../../_components/states";
import {
  addCollectionProductsAction,
  moveCollectionProductAction,
  removeCollectionProductAction,
  updateCollectionAction,
} from "../actions";
import CollectionForm from "../collection-form";

export const metadata = {
  title: "Manage collection",
  description: "Edit a Hype collection and its products.",
};

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function loadCollectionEditor(id: string, q: string, pickPage: number) {
  try {
    const collections = await listCollections();
    const collection = collections.find((item) => item.id === id);
    if (!collection) return { ok: false as const, notFound: true as const };
    const [members, picker] = await Promise.all([
      getAllCollectionProducts(id),
      listProducts({ ...(q ? { search: q } : {}), page: pickPage, pageSize: 10, sort: "name-asc" }),
    ]);
    return { ok: true as const, collection, members, picker };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, notFound: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      notFound: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "The collection could not be loaded.",
    };
  }
}

/**
 * Collection editor: details form, ordered membership (all statuses — drafts
 * stay manageable), server-paginated searchable picker, up/down reordering
 * with full-array transactional rewrites.
 */
export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; pickPage?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const q = param(query.q).trim();
  const pickPage = Math.max(1, Number.parseInt(param(query.pickPage) || "1", 10) || 1);

  const loaded = await loadCollectionEditor(id, q, pickPage);
  if (!loaded.ok) {
    if (loaded.notFound) notFound();
    return loaded.unavailable ? (
      <DbUnavailable section="Collection editing" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { collection, members, picker } = loaded;
  const memberIds = new Set(members.map((member) => member.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ink">Manage collection</h1>
          <VisibilityBadge isVisible={collection.isVisible} />
        </div>
        <Link
          href="/dashboard/collections"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to collections
        </Link>
      </div>

      <section aria-label="Collection details" className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-ink">Details</h2>
        <CollectionForm
          action={updateCollectionAction}
          initial={{
            slug: collection.slug,
            name: collection.name,
            eyebrow: collection.eyebrow,
            description: collection.description ?? "",
            isVisible: collection.isVisible,
          }}
          submitLabel="Save changes"
          isEdit
          entityId={collection.id}
        />
      </section>

      <section aria-label="Collection products" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">Products ({members.length})</h2>
        {members.length === 0 ? (
          <EmptyState title="No products yet." hint="Add products with the picker below." />
        ) : (
          <ol className="flex flex-col gap-2">
            {members.map((member, index) => (
              <li key={member.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas-deep px-4 py-2.5">
                <span className="w-8 text-sm font-semibold text-muted">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{member.name}</span>
                  <span className="block truncate text-xs text-muted">{member.slug}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <form action={moveCollectionProductAction}>
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="productId" value={member.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button type="submit" disabled={index === 0} aria-label={`Move ${member.name} up`} className="rounded-lg border border-line px-2.5 py-1.5 text-sm disabled:opacity-40">
                      ↑
                    </button>
                  </form>
                  <form action={moveCollectionProductAction}>
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="productId" value={member.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button type="submit" disabled={index === members.length - 1} aria-label={`Move ${member.name} down`} className="rounded-lg border border-line px-2.5 py-1.5 text-sm disabled:opacity-40">
                      ↓
                    </button>
                  </form>
                  <form action={removeCollectionProductAction}>
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <input type="hidden" name="productId" value={member.id} />
                    <button type="submit" aria-label={`Remove ${member.name} from collection`} className="rounded-lg border border-line px-2.5 py-1.5 text-sm hover:border-ink">
                      ✕
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label="Add products" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">Add products</h2>
        <form method="get" action={`/dashboard/collections/${collection.id}`} className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Search products" htmlFor="col-q">
              <TextInput id="col-q" name="q" defaultValue={q} placeholder="Name, material, tag…" />
            </Field>
          </div>
          <button type="submit" className="rounded-xl border border-line bg-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink">
            Search
          </button>
        </form>
        {picker.items.length === 0 ? (
          <p className="text-sm text-muted">No products match.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {picker.items.map((product) => {
              const already = memberIds.has(product.id);
              return (
                <li key={product.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas-deep px-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                    <span className="block truncate text-xs text-muted">{product.slug}</span>
                  </span>
                  {already ? (
                    <span className="text-xs font-semibold text-muted">In collection</span>
                  ) : (
                    <form action={addCollectionProductsAction}>
                      <input type="hidden" name="collectionId" value={collection.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-canvas">
                        Add
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted">
          Showing page {picker.page} of {picker.totalPages} ({picker.total} products).
        </p>
      </section>
    </div>
  );
}
