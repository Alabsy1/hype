import Link from "next/link";

import { formatCents } from "@/lib/dashboard/pricing";
import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import type { ProductFilter } from "@/lib/server/repositories/products.repository";
import { listProducts } from "@/lib/server/repositories/products.repository";
import { listCategories } from "@/lib/server/repositories/categories.repository";
import { listDepartments } from "@/lib/server/repositories/departments.repository";

import { AvailabilityBadge, FlagBadge, StatusBadge } from "../_components/badges";
import ConfirmButton from "../_components/confirm-button";
import { Field, Select, TextInput } from "../_components/form-controls";
import Pagination from "../_components/pagination";
import DbUnavailable, { EmptyState, SectionError } from "../_components/states";
import { archiveProductAction } from "./actions";

export const metadata = {
  title: "Products",
  description: "Manage Hype products.",
};

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "featured", label: "Featured" },
  { value: "bestseller", label: "Bestseller" },
] as const;

interface ProductSearchParams {
  q?: string;
  status?: string;
  department?: string;
  category?: string;
  availability?: string;
  flag?: string;
  sort?: string;
  page?: string;
}

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function flagFilter(flag: string): Partial<ProductFilter> {
  if (flag === "featured") return { isFeatured: true };
  if (flag === "bestseller") return { isBestseller: true };
  if (flag === "new") return { isNewArrival: true };
  return {};
}

function updatedLabel(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function loadListData(raw: ProductSearchParams) {
  const q = param(raw.q).trim();
  const status = param(raw.status);
  const department = param(raw.department);
  const category = param(raw.category);
  const availability = param(raw.availability);
  const flag = param(raw.flag);
  const sort = param(raw.sort) || "newest";
  const page = Math.max(1, Number.parseInt(param(raw.page) || "1", 10) || 1);

  const filter: ProductFilter = {
    ...(q ? { search: q } : {}),
    ...(status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED" ? { status } : {}),
    ...(department ? { departmentSlug: department } : {}),
    ...(category ? { categorySlug: category } : {}),
    ...(availability === "IN_STOCK" || availability === "LOW_STOCK" || availability === "MADE_TO_ORDER"
      ? { availability }
      : {}),
    ...flagFilter(flag),
    sort,
    page,
    pageSize: PAGE_SIZE,
  };

  try {
    const [result, departments, categories] = await Promise.all([
      listProducts(filter),
      listDepartments(),
      listCategories(),
    ]);
    return {
      ok: true as const,
      result,
      departments,
      categories,
      filterParams: { q, status, department, category, availability, flag, sort },
    };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "Products could not be loaded.",
    };
  }
}

/**
 * Product catalog manager: server-side search, filters, sorting, and
 * pagination over Phase 05 `listProducts`. Archive is confirm-gated; there is
 * no hard delete.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const loaded = await loadListData(await searchParams);
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Product management" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { result, departments, categories, filterParams } = loaded;
  const { q, status, department, category, availability, flag, sort } = filterParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Products</h1>
          <p className="mt-1 text-sm text-muted">{result.total} products in the database.</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas"
        >
          + New product
        </Link>
      </div>

      <form method="get" action="/dashboard/products" className="grid gap-3 rounded-2xl border border-line bg-canvas p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search" htmlFor="pq">
          <TextInput id="pq" name="q" defaultValue={q} placeholder="Name, material, tag…" />
        </Field>
        <Field label="Status" htmlFor="pstatus">
          <Select id="pstatus" name="status" defaultValue={status}>
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </Select>
        </Field>
        <Field label="Department" htmlFor="pdept">
          <Select id="pdept" name="department" defaultValue={department}>
            <option value="">All departments</option>
            {departments.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Category" htmlFor="pcat">
          <Select id="pcat" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Availability" htmlFor="pavail">
          <Select id="pavail" name="availability" defaultValue={availability}>
            <option value="">Any availability</option>
            <option value="IN_STOCK">In stock</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="MADE_TO_ORDER">Made to order</option>
          </Select>
        </Field>
        <Field label="Flag" htmlFor="pflag">
          <Select id="pflag" name="flag" defaultValue={flag}>
            <option value="">Any flag</option>
            <option value="featured">Featured</option>
            <option value="bestseller">Bestseller</option>
            <option value="new">New arrival</option>
          </Select>
        </Field>
        <Field label="Sort" htmlFor="psort">
          <Select id="psort" name="sort" defaultValue={sort}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-xl border border-line bg-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink">
            Apply filters
          </button>
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState title="No products found." hint="Adjust the filters or create a new product." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-canvas">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3">Product</th>
                <th scope="col" className="px-4 py-3">Placement</th>
                <th scope="col" className="px-4 py-3">Price</th>
                <th scope="col" className="px-4 py-3">Stock / Status</th>
                <th scope="col" className="px-4 py-3">Flags</th>
                <th scope="col" className="px-4 py-3">Updated</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.primaryImage ? (
                        // Plain img: admin tool, avoids remote-pattern config for arbitrary storage URLs.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.primaryImage.mediaAsset.storageUrl}
                          alt=""
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                          No img
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{product.name}</p>
                        <p className="truncate text-xs text-muted">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {product.departmentName} · {product.categoryName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                    {formatCents(product.priceCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      <AvailabilityBadge availability={product.availability} />
                      <StatusBadge status={product.status} />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {product.isFeatured ? <FlagBadge label="Featured" /> : null}
                      {product.isBestseller ? <FlagBadge label="Bestseller" /> : null}
                      {product.isNewArrival ? <FlagBadge label="New" /> : null}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{updatedLabel(product.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink"
                      >
                        Edit
                      </Link>
                      {product.status !== "ARCHIVED" ? (
                        <form action={archiveProductAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <ConfirmButton label="Archive" confirmLabel="Confirm archive" />
                        </form>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/dashboard/products"
        params={filterParams}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        itemLabel="products"
      />
    </div>
  );
}
