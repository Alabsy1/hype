import Link from "next/link";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";

import DbUnavailable, { SectionError } from "../../_components/states";
import { createProductAction } from "../actions";
import { loadProductFormData } from "../form-data";
import ProductForm from "../product-form";

export const metadata = {
  title: "New product",
  description: "Create a Hype product.",
};

async function loadFormLists() {
  try {
    return { ok: true as const, data: await loadProductFormData() };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "The form could not be loaded.",
    };
  }
}

/** Product creation. New products default to DRAFT (explicit publish only). */
export default async function NewProductPage() {
  const loaded = await loadFormLists();
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Product creation" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { departments, categories, comparisonGroups, mediaAssets } = loaded.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">New product</h1>
          <p className="mt-1 text-sm text-muted">Drafts stay private until published.</p>
        </div>
        <Link
          href="/dashboard/products"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to products
        </Link>
      </div>
      <ProductForm
        mode="create"
        action={createProductAction}
        initial={{
          name: "",
          slug: "",
          price: "",
          compareAtPrice: "",
          shortDescription: "",
          description: "",
          departmentId: departments[0]?.id ?? "",
          categoryId: "",
          comparisonGroupId: "",
          material: "",
          materials: "",
          color: "",
          colorFamily: "",
          availability: "IN_STOCK",
          dimWidth: "",
          dimHeight: "",
          dimDepth: "",
          dimUnit: "cm",
          features: "",
          tags: "",
          isFeatured: false,
          isBestseller: false,
          isNewArrival: false,
          status: "DRAFT",
          images: [],
        }}
        departments={departments}
        categories={categories}
        comparisonGroups={comparisonGroups}
        mediaAssets={mediaAssets}
        submitLabel="Create product"
      />
    </div>
  );
}
