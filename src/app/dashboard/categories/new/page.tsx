import Link from "next/link";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { listDepartments } from "@/lib/server/repositories/departments.repository";

import DbUnavailable, { SectionError } from "../../_components/states";
import { createCategoryAction } from "../actions";
import CategoryForm from "../category-form";

export const metadata = {
  title: "New category",
  description: "Create a Hype category.",
};

async function loadDepartments() {
  try {
    return { ok: true as const, departments: await listDepartments() };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "The form could not be loaded.",
    };
  }
}

export default async function NewCategoryPage() {
  const loaded = await loadDepartments();
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Category creation" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { departments } = loaded;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">New category</h1>
          <p className="mt-1 text-sm text-muted">Slugs are unique per department.</p>
        </div>
        <Link
          href="/dashboard/categories"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to categories
        </Link>
      </div>
      <CategoryForm
        action={createCategoryAction}
        initial={{
          departmentId: departments[0]?.id ?? "",
          slug: "",
          name: "",
          tagline: "",
          description: "",
          imageId: "",
          order: "0",
          isVisible: true,
        }}
        departments={departments}
        submitLabel="Create category"
      />
    </div>
  );
}
