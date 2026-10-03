import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { countProducts } from "@/lib/server/repositories/products.repository";
import { listDepartments } from "@/lib/server/repositories/departments.repository";

import DbUnavailable, { SectionError } from "../_components/states";
import { updateDepartmentAction } from "./actions";
import DepartmentRowForm from "./department-row-form";

export const metadata = {
  title: "Departments",
  description: "Manage Hype departments.",
};

async function loadDepartments() {
  try {
    const departments = await listDepartments();
    const counts = await Promise.all(
      departments.map(async (department) => ({
        id: department.id,
        count: await countProducts({ departmentSlug: department.slug }),
      })),
    );
    return { ok: true as const, departments, counts };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "Departments could not be loaded.",
    };
  }
}

/**
 * Department manager. Records come from the database (never hardcoded) and the
 * admin can hide/show each department without deleting any catalog data.
 */
export default async function DepartmentsPage() {
  const loaded = await loadDepartments();
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Department management" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { departments, counts } = loaded;
  const countFor = (id: string) => counts.find((item) => item.id === id)?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Departments</h1>
        <p className="mt-1 text-sm text-muted">
          Visibility controls the future public site. Hiding never deletes data.
        </p>
      </div>
      {departments.length === 0 ? (
        <p className="text-sm text-muted">No departments yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {departments.map((department) => (
            <div key={department.id} className="flex flex-col gap-2">
              <DepartmentRowForm department={department} action={updateDepartmentAction} />
              <p className="px-1 text-xs text-muted">{countFor(department.id)} products in database.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
