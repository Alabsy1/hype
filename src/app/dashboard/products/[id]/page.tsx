import Link from "next/link";
import { notFound } from "next/navigation";

import { centsToDecimalString } from "@/lib/dashboard/pricing";
import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import type { ProductDTO } from "@/lib/server/dto/product.dto";
import {
  getProductAlternatives,
  getProductById,
  listProducts,
} from "@/lib/server/repositories/products.repository";

import { StatusBadge } from "../../_components/badges";
import ConfirmButton from "../../_components/confirm-button";
import DbUnavailable, { SectionError } from "../../_components/states";
import { archiveProductAction, setAlternativesAction, updateProductAction } from "../actions";
import AlternativesForm from "../alternatives-form";
import { loadProductFormData } from "../form-data";
import ProductForm from "../product-form";

export const metadata = {
  title: "Edit product",
  description: "Edit a Hype product.",
};

function dimensionsToStrings(dimensions: unknown): { w: string; h: string; d: string; unit: string } {
  const fallback = { w: "", h: "", d: "", unit: "cm" };
  if (typeof dimensions !== "object" || dimensions === null) return fallback;
  const record = dimensions as Record<string, unknown>;
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? String(value) : "");
  return {
    w: num(record.width),
    h: num(record.height),
    d: num(record.depth),
    unit: record.unit === "in" ? "in" : "cm",
  };
}

async function loadEditData(id: string) {
  try {
    const product: ProductDTO | null = await getProductById(id);
    if (!product) return { ok: false as const, notFound: true as const };
    const [{ departments, categories, comparisonGroups, mediaAssets }, alternatives, candidates] =
      await Promise.all([
        loadProductFormData(),
        getProductAlternatives(id),
        listProducts({ pageSize: 100 }),
      ]);
    return {
      ok: true as const,
      product,
      departments,
      categories,
      comparisonGroups,
      mediaAssets,
      alternatives,
      candidates: candidates.items.filter((item) => item.id !== id),
    };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, notFound: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      notFound: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "The product could not be loaded.",
    };
  }
}

/**
 * Product editor: full form (images replaced as a set on save), symmetric
 * alternatives manager, and confirm-gated archive. Slug edits are allowed but
 * flagged — prefer stable slugs.
 */
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadEditData(id);
  if (!loaded.ok) {
    if (loaded.notFound) notFound();
    return loaded.unavailable ? (
      <DbUnavailable section="Product editing" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { product, departments, categories, comparisonGroups, mediaAssets, alternatives, candidates } = loaded;

  const dims = dimensionsToStrings(product.dimensions);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ink">Edit product</h1>
          <StatusBadge status={product.status} />
        </div>
        <Link
          href="/dashboard/products"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to products
        </Link>
      </div>

      <ProductForm
        mode="edit"
        action={updateProductAction}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: centsToDecimalString(product.priceCents),
          compareAtPrice:
            product.compareAtPriceCents === null
              ? ""
              : centsToDecimalString(product.compareAtPriceCents),
          shortDescription: product.shortDescription,
          description: product.description,
          departmentId: product.departmentId,
          categoryId: product.categoryId,
          comparisonGroupId: product.comparisonGroupId,
          material: product.material,
          materials: product.materials.join(", "),
          color: product.color,
          colorFamily: product.colorFamily ?? "",
          availability: product.availability,
          dimWidth: dims.w,
          dimHeight: dims.h,
          dimDepth: dims.d,
          dimUnit: dims.unit,
          features: product.features.join("\n"),
          tags: product.tags.join(", "),
          isFeatured: product.isFeatured,
          isBestseller: product.isBestseller,
          isNewArrival: product.isNewArrival,
          status: product.status,
          images: product.images.map((image, index) => ({
            key: `${image.id}-${index}`,
            mediaAssetId: image.mediaAsset.id,
            altText: image.altText ?? "",
          })),
        }}
        departments={departments}
        categories={categories}
        comparisonGroups={comparisonGroups}
        mediaAssets={mediaAssets}
        submitLabel="Save changes"
      />

      <section aria-label="Alternatives" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">Alternatives</h2>
        <p className="text-sm text-muted">
          Related products for compare flows. Saved symmetrically — each selected product also
          lists this one as an alternative.
        </p>
        <AlternativesForm
          productId={product.id}
          current={alternatives}
          candidates={candidates}
          action={setAlternativesAction}
        />
      </section>

      <section aria-label="Danger zone" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">Archive</h2>
        <p className="text-sm text-muted">
          Archiving hides the product without deleting it. Published history is retained.
        </p>
        {product.status !== "ARCHIVED" ? (
          <form action={archiveProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="returnTo" value="/dashboard/products" />
            <ConfirmButton label="Archive product" confirmLabel="Confirm archive" />
          </form>
        ) : (
          <p className="text-sm text-muted">This product is already archived.</p>
        )}
      </section>
    </div>
  );
}
