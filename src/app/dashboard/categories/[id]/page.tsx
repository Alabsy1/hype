import Link from "next/link";
import { notFound } from "next/navigation";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { getCategoryById } from "@/lib/server/repositories/categories.repository";
import { listDepartments } from "@/lib/server/repositories/departments.repository";

import DbUnavailable, { SectionError } from "../../_components/states";
import { updateCategoryAction } from "../actions";
import CategoryForm from "../category-form";

export const metadata = {
  title: "Edit category",
  description: "Edit a Hype category.",
};

async function loadEditData(id: string) {
  try {
    const [category, departments] = await Promise.all([getCategoryById(id), listDepartments()]);
    if (!category) return { ok: false as const, notFound: true as const };
    return { ok: true as const, category, departments };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, notFound: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      notFound: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "The category could not be loaded.",
    };
  }
}

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadEditData(id);
  if (!loaded.ok) {
    if (loaded.notFound) notFound();
    return loaded.unavailable ? (
      <DbUnavailable section="Category editing" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { category, departments } = loaded;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Edit category</h1>
          <p className="mt-1 text-sm text-muted">{category.name}</p>
        </div>
        <Link
          href="/dashboard/categories"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to categories
        </Link>
      </div>
      <CategoryForm
        action={updateCategoryAction}
        initial={{
          departmentId: category.departmentId,
          slug: category.slug,
          name: category.name,
          tagline: category.tagline ?? "",
          description: category.description ?? "",
          imageId: category.imageId ?? "",
          order: String(category.order),
          isVisible: category.isVisible,
        }}
        departments={departments}
        original={{ departmentId: category.departmentId, slug: category.slug }}
        submitLabel="Save changes"
      />
    </div>
  );
}
