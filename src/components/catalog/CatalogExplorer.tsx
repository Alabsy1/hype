"use client";

import { useMemo, useState, type ReactNode } from "react";
import ProductCard from "@/components/products/ProductCard";
import { CloseIcon } from "@/components/ui/Icons";
import {
  availabilityLabel,
  emptyFilters,
  filterProducts,
  getColorFamily,
  getFilterOptions,
  priceBands,
  type CatalogFilters,
  type SortKey,
} from "@/lib/catalog-ui";
import type { Availability, Category, Product } from "@/data/types";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest first" },
  { key: "price-asc", label: "Price — low to high" },
  { key: "price-desc", label: "Price — high to low" },
];

interface CatalogExplorerProps {
  products: Product[];
  initialCategory?: string;
  initialSort?: SortKey;
  showCategoryFilter?: boolean;
  /** Category list for the filter panel and card labels (resolved server-side from the DB). */
  categories: Category[];
  /** Label for the "all" reset option. Defaults to the furniture catalog. */
  allLabel?: string;
  /** Route prefix for product detail links. Defaults to the furniture catalog. */
  productBasePath?: string;
}

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5">
      <legend className="sr-only">{title}</legend>
      <p className="eyebrow mb-4">{title}</p>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-1 text-sm text-ink-soft transition-colors hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer appearance-none border border-line bg-transparent checked:border-ink checked:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <span className={checked ? "text-ink" : undefined}>{label}</span>
      {typeof count === "number" ? (
        <span className="ml-auto text-[0.68rem] tabular-nums text-muted">{count}</span>
      ) : null}
    </label>
  );
}

export default function CatalogExplorer({
  products,
  initialCategory,
  initialSort = "featured",
  showCategoryFilter = true,
  categories,
  allLabel = "All furniture",
  productBasePath,
}: CatalogExplorerProps) {
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [filters, setFilters] = useState<CatalogFilters>({
    ...emptyFilters,
    category: initialCategory,
    colorFamilies: [],
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const options = useMemo(() => getFilterOptions(products), [products]);
  const results = useMemo(() => filterProducts(products, filters, sort), [products, filters, sort]);

  const activeCount =
    filters.materials.length +
    filters.colorFamilies.length +
    filters.availability.length +
    (filters.price !== "all" ? 1 : 0);

  const patch = (partial: Partial<CatalogFilters>) =>
    setFilters((current) => ({ ...current, ...partial }));

  const clearAll = () =>
    setFilters({ ...emptyFilters, category: initialCategory, colorFamilies: [] });

  const countFor = (predicate: (product: Product) => boolean) =>
    products.filter(predicate).length;

  const panel = (
    <div className="space-y-6">
      {showCategoryFilter ? (
        <FilterGroup title="Category">
          <button
            type="button"
            onClick={() => patch({ category: undefined })}
            className={`block py-1 text-left text-sm transition-colors ${
              !filters.category ? "text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {allLabel}
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() =>
                patch({ category: filters.category === category.slug ? undefined : category.slug })
              }
              className={`flex w-full items-baseline justify-between gap-3 py-1 text-left text-sm transition-colors ${
                filters.category === category.slug ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              <span className={filters.category === category.slug ? "link-underline" : undefined}>
                {category.name}
              </span>
              <span className="text-[0.68rem] tabular-nums text-muted">
                {countFor((product) => product.category === category.slug)}
              </span>
            </button>
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Material">
        {options.materials.map((material) => (
          <CheckRow
            key={material}
            label={material}
            checked={filters.materials.includes(material)}
            onChange={() => patch({ materials: toggleInList(filters.materials, material) })}
            count={countFor((product) => product.material.toLowerCase().includes(material.toLowerCase()))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Colour family">
        {options.colorFamilies.map((family) => (
          <CheckRow
            key={family}
            label={family}
            checked={filters.colorFamilies.includes(family)}
            onChange={() =>
              patch({ colorFamilies: toggleInList(filters.colorFamilies, family) })
            }
            count={countFor((product) => getColorFamily(product.color) === family)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        {options.availability.map((availability: Availability) => (
          <CheckRow
            key={availability}
            label={availabilityLabel[availability]}
            checked={filters.availability.includes(availability)}
            onChange={() =>
              patch({ availability: toggleInList(filters.availability, availability) })
            }
            count={countFor((product) => product.availability === availability)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {priceBands.map((band) => (
          <label
            key={band.key}
            className="flex cursor-pointer items-center gap-3 py-1 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <input
              type="radio"
              name="price-band"
              checked={filters.price === band.key}
              onChange={() => patch({ price: band.key })}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer appearance-none rounded-full border border-line bg-transparent checked:border-[4px] checked:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <span className={filters.price === band.key ? "text-ink" : undefined}>{band.label}</span>
          </label>
        ))}
      </FilterGroup>

      <button
        type="button"
        onClick={clearAll}
        disabled={activeCount === 0 && !filters.category}
        className="link-underline meta text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <p className="meta text-ink-soft">
          <span className="tabular-nums text-ink">{results.length}</span>{" "}
          {results.length === 1 ? "piece" : "pieces"}
          {filters.category && !showCategoryFilter ? " in this category" : ""}
        </p>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            className="flex items-center gap-2 border border-line px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] transition-colors hover:border-ink lg:hidden"
          >
            {panelOpen ? <CloseIcon className="h-3.5 w-3.5" /> : null}
            Filters{activeCount ? ` (${activeCount})` : ""}
          </button>

          <label className="flex items-center gap-2 border border-line px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] transition-colors focus-within:border-ink hover:border-ink">
            <span className="text-muted">Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-6 cursor-pointer bg-transparent text-ink outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-10 pt-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
        <aside
          className={`${panelOpen ? "block" : "hidden"} lg:block`}
          aria-label="Product filters"
        >
          <div className="lg:sticky lg:top-28">{panel}</div>
        </aside>

        <div>
          {results.length ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-7">
              {results.map((product, index) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  ratio={index % 3 === 1 ? "portrait" : index % 3 === 2 ? "tall" : "portrait"}
                  priority={index < 3}
                  productBasePath={productBasePath}
                  categoryName={categories.find((category) => category.slug === product.category)?.name ?? product.category}
                />
              ))}
            </div>
          ) : (
            <div className="border border-line px-6 py-20 text-center">
              <p className="display-md">Nothing matches that yet.</p>
              <p className="lede mx-auto mt-4 max-w-sm">
                Try removing a filter — the collection is deliberately small, so combinations run
                out quickly.
              </p>
              <button type="button" onClick={clearAll} className="btn btn-outline mt-8">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
