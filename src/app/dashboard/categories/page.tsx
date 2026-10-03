import Link from "next/link";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { listCategories } from "@/lib/server/repositories/categories.repository";
import { listDepartments } from "@/lib/server/repositories/departments.repository";

import { VisibilityBadge } from "../_components/badges";
import { Field, Select } from "../_components/form-controls";
import DbUnavailable, { EmptyState, SectionError } from "../_components/states";

export const metadata = {
  title: "Categories",
  description: "Manage Hype categories.",
};

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function loadCategories(department: string) {
  try {
    const [departments, categories] = await Promise.all([listDepartments(), listCategories()]);
    return {
      ok: true as const,
      departments,
      visible: department ? categories.filter((item) => item.departmentId === department) : categories,
    };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "Categories could not be loaded.",
    };
  }
}

/** Category manager with department filter and visibility states. */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const department = param((await searchParams).department);
  const loaded = await loadCategories(department);
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Category management" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { departments, visible } = loaded;
  const departmentName = (id: string) => departments.find((item) => item.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Categories</h1>
          <p className="mt-1 text-sm text-muted">{visible.length} categories.</p>
        </div>
        <Link
          href="/dashboard/categories/new"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas"
        >
          + New category
        </Link>
      </div>

      <form method="get" action="/dashboard/categories" className="flex max-w-md flex-col gap-3 rounded-2xl border border-line bg-canvas p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Department" htmlFor="cdept">
            <Select id="cdept" name="department" defaultValue={department}>
              <option value="">All departments</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <button type="submit" className="rounded-xl border border-line bg-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink">
          Filter
        </button>
      </form>

      {visible.length === 0 ? (
        <EmptyState title="No categories found." hint="Adjust the filter or create a new category." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((category) => (
            <li key={category.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-canvas p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{category.name}</p>
                  <p className="truncate text-xs text-muted">
                    {departmentName(category.departmentId)} · {category.slug} · order {category.order}
                  </p>
                </div>
                <VisibilityBadge isVisible={category.isVisible} />
              </div>
              {category.tagline ? <p className="text-sm text-ink-soft">{category.tagline}</p> : null}
              <p className="text-xs text-muted">{category.productCount} published products</p>
              <div>
                <Link
                  href={`/dashboard/categories/${category.id}`}
                  className="inline-block rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
