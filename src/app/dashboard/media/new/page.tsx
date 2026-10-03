import Link from "next/link";

import MediaForm from "../media-form";
import { createMediaAssetAction } from "../actions";

export const metadata = {
  title: "New media asset",
  description: "Register Hype media metadata.",
};

export default function NewMediaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">New media asset</h1>
          <p className="mt-1 text-sm text-muted">Reference an existing file — uploads are deferred.</p>
        </div>
        <Link
          href="/dashboard/media"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to media
        </Link>
      </div>
      <MediaForm
        action={createMediaAssetAction}
        initial={{ storageUrl: "", mimeType: "image/jpeg", sizeBytes: "", width: "", height: "", altText: "" }}
        submitLabel="Register asset"
      />
    </div>
  );
}
