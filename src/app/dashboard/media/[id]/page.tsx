import Link from "next/link";
import { notFound } from "next/navigation";

import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { getMediaAssetById } from "@/lib/server/repositories/media.repository";

import DbUnavailable, { SectionError } from "../../_components/states";
import { updateMediaAssetAction } from "../actions";
import MediaForm from "../media-form";

export const metadata = {
  title: "Edit media asset",
  description: "Edit Hype media metadata.",
};

async function loadAsset(id: string) {
  try {
    const asset = await getMediaAssetById(id);
    if (!asset) return { ok: false as const, notFound: true as const };
    return { ok: true as const, asset };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, notFound: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      notFound: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "The asset could not be loaded.",
    };
  }
}

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadAsset(id);
  if (!loaded.ok) {
    if (loaded.notFound) notFound();
    return loaded.unavailable ? (
      <DbUnavailable section="Media editing" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { asset } = loaded;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-ink">Edit media asset</h1>
          <p className="mt-1 truncate text-sm text-muted">{asset.storageUrl}</p>
        </div>
        <Link
          href="/dashboard/media"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to media
        </Link>
      </div>
      <MediaForm
        action={updateMediaAssetAction}
        initial={{
          storageUrl: asset.storageUrl,
          mimeType: asset.mimeType,
          sizeBytes: String(asset.sizeBytes),
          width: asset.width === null ? "" : String(asset.width),
          height: asset.height === null ? "" : String(asset.height),
          altText: asset.altText ?? "",
        }}
        submitLabel="Save changes"
        isEdit
        entityId={asset.id}
      />
    </div>
  );
}
