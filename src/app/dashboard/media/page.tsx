import Link from "next/link";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { listMediaAssets } from "@/lib/server/repositories/media.repository";

import { Field, TextInput } from "../_components/form-controls";
import Pagination from "../_components/pagination";
import DbUnavailable, { EmptyState, SectionError } from "../_components/states";

export const metadata = {
  title: "Media",
  description: "Manage Hype media metadata.",
};

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadMedia(q: string, page: number) {
  try {
    return {
      ok: true as const,
      result: await listMediaAssets({ ...(q ? { search: q } : {}), page, pageSize: 24 }),
    };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "Media assets could not be loaded.",
    };
  }
}

/** Media metadata manager (no binary uploads — storage provider deferred). */
export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const query = await searchParams;
  const q = param(query.q).trim();
  const page = Math.max(1, Number.parseInt(param(query.page) || "1", 10) || 1);

  const loaded = await loadMedia(q, page);
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Media management" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { result } = loaded;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Media</h1>
          <p className="mt-1 text-sm text-muted">{result.total} assets. Metadata only — uploads deferred.</p>
        </div>
        <Link
          href="/dashboard/media/new"
          className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas"
        >
          + New asset
        </Link>
      </div>

      <form method="get" action="/dashboard/media" className="flex max-w-md flex-col gap-3 rounded-2xl border border-line bg-canvas p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Search" htmlFor="mq">
            <TextInput id="mq" name="q" defaultValue={q} placeholder="URL, alt text, MIME…" />
          </Field>
        </div>
        <button type="submit" className="rounded-xl border border-line bg-canvas-deep px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink">
          Search
        </button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState title="No media assets found." hint="Register a storage URL to reference it from products." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-canvas">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3">Preview</th>
                <th scope="col" className="px-4 py-3">Storage URL</th>
                <th scope="col" className="px-4 py-3">Type / Size</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((asset) => (
                <tr key={asset.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {asset.mimeType.startsWith("image/") ? (
                      // Plain img: admin tool over arbitrary storage URLs (no remote-pattern config).
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.storageUrl} alt="" loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-xs text-muted">
                        File
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate font-medium text-ink">{asset.storageUrl}</p>
                    <p className="truncate text-xs text-muted">{asset.altText ?? "No alt text"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {asset.mimeType} · {formatBytes(asset.sizeBytes)}
                    {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : null}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/media/${asset.id}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/dashboard/media"
        params={{ q }}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        itemLabel="assets"
      />
    </div>
  );
}
