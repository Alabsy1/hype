"use client";

import { useActionState, useMemo, useState } from "react";

import { suggestSlug } from "@/lib/dashboard/slug";
import type { ActionState } from "@/lib/server/dashboard/action";
import type { MediaAssetRow } from "@/lib/server/repositories/media.repository";

import { Checkbox, Field, Select, TextArea, TextInput } from "../_components/form-controls";
import SubmitButton from "../_components/submit-button";

export interface ProductImageRow {
  key: string;
  mediaAssetId: string;
  altText: string;
}

export interface ProductFormInitial {
  id?: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string;
  shortDescription: string;
  description: string;
  departmentId: string;
  categoryId: string;
  comparisonGroupId: string;
  material: string;
  materials: string;
  color: string;
  colorFamily: string;
  availability: string;
  dimWidth: string;
  dimHeight: string;
  dimDepth: string;
  dimUnit: string;
  features: string;
  tags: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  status: string;
  images: ProductImageRow[];
}

export interface ProductFormOption {
  id: string;
  name: string;
  departmentId?: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initial: ProductFormInitial;
  departments: ProductFormOption[];
  categories: ProductFormOption[];
  comparisonGroups: ProductFormOption[];
  mediaAssets: MediaAssetRow[];
  submitLabel: string;
}

let imageKey = 0;
const nextKey = () => `img-${Date.now()}-${(imageKey += 1)}`;

/**
 * Shared create/edit product form (client component for interactivity:
 * slug suggestion, department-filtered categories, dynamic image rows).
 * All values are re-validated server-side — nothing here is trusted.
 */
export default function ProductForm({
  mode,
  action,
  initial,
  departments,
  categories,
  comparisonGroups,
  mediaAssets,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [departmentId, setDepartmentId] = useState(initial.departmentId);
  const [images, setImages] = useState<ProductImageRow[]>(initial.images);

  const visibleCategories = useMemo(
    () => categories.filter((category) => !departmentId || category.departmentId === departmentId),
    [categories, departmentId],
  );

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      {state.ok && mode === "edit" ? (
        <p role="status" className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
          Saved.
        </p>
      ) : null}

      <section aria-label="Basic information" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">1. Basic information</h2>
        <Field label="Name" htmlFor="pf-name" required>
          <TextInput id="pf-name" name="name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field
          label="Slug"
          htmlFor="pf-slug"
          required
          hint={mode === "edit" ? "Changing the slug changes future public product URLs. Prefer stable slugs." : "Lowercase letters, numbers, hyphens."}
        >
          <div className="flex gap-2">
            <TextInput id="pf-slug" name="slug" required maxLength={160} value={slug} onChange={(event) => setSlug(event.target.value)} />
            <button
              type="button"
              onClick={() => setSlug(suggestSlug(name))}
              className="shrink-0 rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
            >
              Suggest
            </button>
          </div>
        </Field>
        <Field label="Short description" htmlFor="pf-short" required>
          <TextArea id="pf-short" name="shortDescription" required maxLength={500} defaultValue={initial.shortDescription} rows={2} />
        </Field>
        <Field label="Description" htmlFor="pf-desc" required>
          <TextArea id="pf-desc" name="description" required maxLength={20000} defaultValue={initial.description} rows={5} />
        </Field>
      </section>

      <section aria-label="Pricing" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">2. Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (USD)" htmlFor="pf-price" required hint="Stored as integer cents.">
            <TextInput id="pf-price" name="price" required inputMode="decimal" placeholder="1299.50" defaultValue={initial.price} />
          </Field>
          <Field label="Compare-at price (USD)" htmlFor="pf-compare" hint="Optional original price.">
            <TextInput id="pf-compare" name="compareAtPrice" inputMode="decimal" placeholder="1599.00" defaultValue={initial.compareAtPrice} />
          </Field>
        </div>
      </section>

      <section aria-label="Catalog placement" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">3. Catalog placement</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Department" htmlFor="pf-dept" required>
            <Select id="pf-dept" name="departmentId" required value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">Select…</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category" htmlFor="pf-cat" required hint="Filtered by department.">
            <Select id="pf-cat" name="categoryId" required defaultValue={initial.categoryId}>
              <option value="">Select…</option>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Comparison group" htmlFor="pf-cg" required>
            <Select id="pf-cg" name="comparisonGroupId" required defaultValue={initial.comparisonGroupId}>
              <option value="">Select…</option>
              {comparisonGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section aria-label="Materials and appearance" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">4. Materials &amp; appearance</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary material" htmlFor="pf-material" required>
            <TextInput id="pf-material" name="material" required maxLength={200} defaultValue={initial.material} />
          </Field>
          <Field label="Color" htmlFor="pf-color" required>
            <TextInput id="pf-color" name="color" required maxLength={200} defaultValue={initial.color} />
          </Field>
          <Field label="All materials" htmlFor="pf-materials" hint="Comma-separated.">
            <TextInput id="pf-materials" name="materials" maxLength={2000} defaultValue={initial.materials} placeholder="Oak, Bouclé" />
          </Field>
          <Field label="Color family" htmlFor="pf-colorfamily" hint="Optional grouping (e.g. neutrals).">
            <TextInput id="pf-colorfamily" name="colorFamily" maxLength={200} defaultValue={initial.colorFamily} />
          </Field>
        </div>
      </section>

      <section aria-label="Dimensions" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">5. Dimensions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Width" htmlFor="pf-w" required>
            <TextInput id="pf-w" name="dimWidth" required inputMode="decimal" defaultValue={initial.dimWidth} />
          </Field>
          <Field label="Height" htmlFor="pf-h" required>
            <TextInput id="pf-h" name="dimHeight" required inputMode="decimal" defaultValue={initial.dimHeight} />
          </Field>
          <Field label="Depth" htmlFor="pf-d" required>
            <TextInput id="pf-d" name="dimDepth" required inputMode="decimal" defaultValue={initial.dimDepth} />
          </Field>
          <Field label="Unit" htmlFor="pf-u" required>
            <Select id="pf-u" name="dimUnit" required defaultValue={initial.dimUnit}>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </Select>
          </Field>
        </div>
      </section>

      <section aria-label="Details" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">6. Details</h2>
        <Field label="Features" htmlFor="pf-features" hint="One per line.">
          <TextArea id="pf-features" name="features" defaultValue={initial.features} rows={4} />
        </Field>
        <Field label="Tags" htmlFor="pf-tags" hint="Comma-separated.">
          <TextInput id="pf-tags" name="tags" defaultValue={initial.tags} placeholder="sofa, bouclé, bestseller" />
        </Field>
      </section>

      <section aria-label="Images" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">7. Images</h2>
        <p className="text-sm text-muted">
          Metadata only — no file uploads in this phase. First row (position 0) is the primary
          image. {mediaAssets.length === 0 ? "No media assets exist yet — add some in Media first." : null}
        </p>
        <ol className="flex flex-col gap-3">
          {images.map((image, index) => (
            <li key={image.key} className="flex flex-col gap-2 rounded-xl border border-line bg-canvas-deep p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                Position {index}{index === 0 ? " — primary" : null}
              </p>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Select
                  aria-label={`Image ${index + 1} media asset`}
                  value={image.mediaAssetId}
                  onChange={(event) =>
                    setImages((rows) => rows.map((row) => (row.key === image.key ? { ...row, mediaAssetId: event.target.value } : row)))
                  }
                >
                  {mediaAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.storageUrl}
                    </option>
                  ))}
                </Select>
                <TextInput
                  aria-label={`Image ${index + 1} alt text`}
                  placeholder="Alt text (optional)"
                  maxLength={300}
                  value={image.altText}
                  onChange={(event) =>
                    setImages((rows) => rows.map((row) => (row.key === image.key ? { ...row, altText: event.target.value } : row)))
                  }
                />
                <span className="flex gap-2">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} up`} className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-40">↑</button>
                  <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label={`Move image ${index + 1} down`} className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-40">↓</button>
                  <button type="button" onClick={() => setImages((rows) => rows.filter((row) => row.key !== image.key))} aria-label={`Remove image ${index + 1}`} className="rounded-lg border border-line px-3 py-2 text-sm">✕</button>
                </span>
              </div>
              <input type="hidden" name="imageAssetId" value={image.mediaAssetId} />
              <input type="hidden" name="imageAlt" value={image.altText} />
            </li>
          ))}
        </ol>
        <div>
          <button
            type="button"
            disabled={mediaAssets.length === 0}
            onClick={() => setImages((rows) => [...rows, { key: nextKey(), mediaAssetId: mediaAssets[0]?.id ?? "", altText: "" }])}
            className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink disabled:opacity-40"
          >
            + Add image
          </button>
        </div>
      </section>

      <section aria-label="Publishing" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">8. Publishing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Availability" htmlFor="pf-avail" required>
            <Select id="pf-avail" name="availability" required defaultValue={initial.availability}>
              <option value="IN_STOCK">In stock</option>
              <option value="LOW_STOCK">Low stock</option>
              <option value="MADE_TO_ORDER">Made to order</option>
            </Select>
          </Field>
          <Field
            label="Status"
            htmlFor="pf-status"
            required
            hint="DRAFT is not public. PUBLISHED makes the product eligible for the future public site. ARCHIVED retains it without publicity."
          >
            <Select id="pf-status" name="status" required defaultValue={initial.status}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              {mode === "edit" ? <option value="ARCHIVED">ARCHIVED</option> : null}
            </Select>
          </Field>
        </div>
      </section>

      <section aria-label="Flags" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <h2 className="font-display text-xl text-ink">9. Flags</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Checkbox id="pf-featured" name="isFeatured" label="Featured" defaultChecked={initial.isFeatured} />
          <Checkbox id="pf-bestseller" name="isBestseller" label="Bestseller" defaultChecked={initial.isBestseller} />
          <Checkbox id="pf-new" name="isNewArrival" label="New arrival" defaultChecked={initial.isNewArrival} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} pendingLabel="Saving…" />
      </div>
    </form>
  );
}
