"use client";

import Image from "next/image";
import Link from "next/link";
import { useCompare, COMPARE_LIMIT } from "./CompareProvider";
import { CloseIcon } from "@/components/ui/Icons";
import {
  availabilityLabel,
  formatPrice,
  getBySlugs,
  getProductDepartment,
  getProductPath,
} from "@/lib/catalog-ui";
import type { Product } from "@/data/types";

const rows: { label: string; render: (product: ReturnType<typeof getBySlugs>[number]) => React.ReactNode }[] = [
  { label: "Price", render: (product) => (
      <span className="tabular-nums">
        {formatPrice(product.price)}
        {product.compareAtPrice ? (
          <span className="ml-2 text-muted line-through">
            {formatPrice(product.compareAtPrice)}
          </span>
        ) : null}
      </span>
    ) },
  { label: "Availability", render: (product) => availabilityLabel[product.availability] },
  { label: "Dimensions", render: (product) => (
      <span className="tabular-nums">
        {product.dimensions.width} × {product.dimensions.depth} × {product.dimensions.height}{" "}
        {product.dimensions.unit}
      </span>
    ) },
  { label: "Material", render: (product) => product.material },
  { label: "Colour", render: (product) => product.color },
  { label: "Category", render: (product) => product.category.replace(/-/g, " ") },
  { label: "Features", render: (product) => (
      <ul className="space-y-1.5">
        {product.features.map((feature) => (
          <li key={feature} className="text-ink-soft">
            {feature}
          </li>
        ))}
      </ul>
    ) },
  { label: "Tags", render: (product) => <span className="text-ink-soft">{product.tags.join(" · ")}</span> },
];

export default function CompareTable({ products }: { products: Product[] }) {
  const { items, remove, clear, toggle, isFull, isReady } = useCompare();
  const selected = getBySlugs(items, products);
  // Suggestions stay in the furniture catalog unless the whole selection is
  // decoration, so furniture-only comparison behavior is unchanged.
  const allDecoration = selected.length > 0 &&
    selected.every((product) => getProductDepartment(product) === "decoration");
  const suggestionPool = products.filter((product) =>
    allDecoration
      ? getProductDepartment(product) === "decoration"
      : getProductDepartment(product) === "furniture",
  );
  const suggestions = suggestionPool
    .filter((product) => !items.includes(product.slug))
    .slice(0, 4);

  if (!isReady) {
    return (
      <div className="border border-line px-6 py-16 text-center">
        <p className="meta text-muted">Loading your comparison…</p>
      </div>
    );
  }

  if (!selected.length) {
    return (
      <div className="border border-line px-6 py-14 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">Nothing selected yet</p>
          <h2 className="display-md mt-4">Build a comparison.</h2>
          <p className="lede mt-4">
            Add up to {COMPARE_LIMIT} pieces from any product page — the selection is kept in this
            browser, so you can close the tab and come back.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-4">
          {suggestions.map((product) => (
            <div key={product.slug}>
              <Link href={getProductPath(product)} className="group block">
                <div className="frame relative aspect-[4/5]">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 45vw, 22vw"
                    className="object-cover"
                  />
                </div>
                <p className="mt-3 text-sm transition-colors group-hover:text-accent">
                  {product.name}
                </p>
                <p className="meta mt-1 tabular-nums text-muted">{formatPrice(product.price)}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
        <p className="meta text-ink-soft">
          <span className="tabular-nums text-ink">{selected.length}</span> of {COMPARE_LIMIT}{" "}
          pieces selected
        </p>
        <button type="button" onClick={clear} className="link-underline meta text-accent">
          Clear all
        </button>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[46rem] table-fixed border-collapse text-sm">
          <caption className="sr-only">Side-by-side comparison of selected furniture pieces</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-36 bg-canvas py-4 pr-6 text-left align-bottom">
                <span className="meta text-muted">Piece</span>
              </th>
              {selected.map((product) => (
                <th
                  key={product.slug}
                  scope="col"
                  className="border-l border-line px-4 py-4 text-left align-bottom"
                >
                  <div className="frame relative mb-4 aspect-[4/3]">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="240px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => remove(product.slug)}
                      aria-label={`Remove ${product.name} from comparison`}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-canvas/92 text-ink transition-colors hover:bg-ink hover:text-canvas"
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link
                    href={getProductPath(product)}
                    className="link-underline font-display text-base font-normal leading-snug text-ink"
                  >
                    {product.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-line align-top">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-canvas py-4 pr-6 text-left align-top"
                >
                  <span className="meta text-muted">{row.label}</span>
                </th>
                {selected.map((product) => (
                  <td key={product.slug} className="border-l border-line px-4 py-4">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}

            <tr className="border-t border-line">
              <th scope="row" className="sticky left-0 z-10 bg-canvas py-5 pr-6 text-left">
                <span className="meta text-muted">Next step</span>
              </th>
              {selected.map((product) => (
                <td key={product.slug} className="border-l border-line px-4 py-5">
                  <div className="flex flex-col items-start gap-3">
                    <Link
                      href={getProductPath(product)}
                      className="btn btn-outline !py-2.5"
                    >
                      View piece
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(product.slug)}
                      className="link-underline meta text-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {selected.length < COMPARE_LIMIT ? (
        <div className="mt-12">
          <p className="eyebrow">Add another</p>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
            {suggestions.slice(0, COMPARE_LIMIT - selected.length).map((product) => (
              <div key={product.slug} className="flex flex-col gap-3">
                <Link href={getProductPath(product)} className="group block">
                  <div className="frame relative aspect-[4/5]">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 45vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-3 text-sm transition-colors group-hover:text-accent">
                    {product.name}
                  </p>
                  <p className="meta mt-1 tabular-nums text-muted">{formatPrice(product.price)}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(product.slug)}
                  disabled={isFull}
                  className="link-underline meta self-start text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add to comparison
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
