import Link from "next/link";

/**
 * Server-rendered pagination preserving the current filter query string.
 * Only renders controls that have a destination.
 */
export default function Pagination({
  basePath,
  params,
  page,
  totalPages,
  total,
  itemLabel = "items",
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  total: number;
  itemLabel?: string;
}) {
  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, value);
    }
    search.set("page", String(target));
    return `${basePath}?${search.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Page {page} of {totalPages} · {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
          >
            ← Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
          >
            Next →
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
