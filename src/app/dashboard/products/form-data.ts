import { listCategories } from "@/lib/server/repositories/categories.repository";
import { listComparisonGroups } from "@/lib/server/repositories/comparison-groups.repository";
import { listDepartments } from "@/lib/server/repositories/departments.repository";
import { listMediaAssets } from "@/lib/server/repositories/media.repository";

/**
 * Supporting lists for the product create/edit forms. Throws data-layer
 * errors to the caller so pages can render unavailable/error states.
 */
export async function loadProductFormData() {
  const [departments, categories, comparisonGroups, media] = await Promise.all([
    listDepartments(),
    listCategories(),
    listComparisonGroups(),
    listMediaAssets({ pageSize: 100 }),
  ]);
  return { departments, categories, comparisonGroups, mediaAssets: media.items };
}
