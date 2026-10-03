import Link from "next/link";

import CollectionForm from "../collection-form";
import { createCollectionAction } from "../actions";

export const metadata = {
  title: "New collection",
  description: "Create a Hype collection.",
};

export default function NewCollectionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">New collection</h1>
          <p className="mt-1 text-sm text-muted">Products are added after creation.</p>
        </div>
        <Link
          href="/dashboard/collections"
          className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        >
          ← Back to collections
        </Link>
      </div>
      <CollectionForm
        action={createCollectionAction}
        initial={{ slug: "", name: "", eyebrow: "", description: "", isVisible: true }}
        submitLabel="Create collection"
      />
    </div>
  );
}
