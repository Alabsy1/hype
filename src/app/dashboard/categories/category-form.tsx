"use client";

import { useActionState, useState } from "react";

import { suggestSlug } from "@/lib/dashboard/slug";
import type { ActionState } from "@/lib/server/dashboard/action";

import { Checkbox, Field, Select, TextArea, TextInput } from "../_components/form-controls";
import SubmitButton from "../_components/submit-button";

export interface CategoryFormInitial {
  departmentId: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageId: string;
  order: string;
  isVisible: boolean;
}

interface CategoryFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initial: CategoryFormInitial;
  departments: { id: string; name: string }[];
  original?: { departmentId: string; slug: string };
  submitLabel: string;
}

/** Shared create/edit category form. Slug uniqueness is department-scoped. */
export default function CategoryForm({ action, initial, departments, original, submitLabel }: CategoryFormProps) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5 rounded-2xl border border-line bg-canvas p-5">
      {original ? (
        <>
          <input type="hidden" name="originalDepartmentId" value={original.departmentId} />
          <input type="hidden" name="originalSlug" value={original.slug} />
        </>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      {state.ok && original ? (
        <p role="status" className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
          Saved.
        </p>
      ) : null}

      <Field label="Department" htmlFor="cf-dept" required hint="Slug uniqueness is scoped to this department.">
        <Select id="cf-dept" name="departmentId" required defaultValue={initial.departmentId}>
          <option value="">Select…</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Name" htmlFor="cf-name" required>
        <TextInput id="cf-name" name="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Slug" htmlFor="cf-slug" required>
        <div className="flex gap-2">
          <TextInput id="cf-slug" name="slug" required maxLength={160} value={slug} onChange={(event) => setSlug(event.target.value)} />
          <button
            type="button"
            onClick={() => setSlug(suggestSlug(name))}
            className="shrink-0 rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
          >
            Suggest
          </button>
        </div>
      </Field>
      <Field label="Tagline" htmlFor="cf-tagline">
        <TextInput id="cf-tagline" name="tagline" maxLength={200} defaultValue={initial.tagline} />
      </Field>
      <Field label="Description" htmlFor="cf-desc">
        <TextArea id="cf-desc" name="description" maxLength={5000} defaultValue={initial.description} rows={3} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Order" htmlFor="cf-order" hint="Lower appears first.">
          <TextInput id="cf-order" name="order" inputMode="numeric" defaultValue={initial.order} placeholder="0" />
        </Field>
        <Field label="List image (media id)" htmlFor="cf-image" hint="Optional MediaAsset id.">
          <TextInput id="cf-image" name="imageId" defaultValue={initial.imageId} placeholder="Leave empty for none" />
        </Field>
      </div>
      <Checkbox id="cf-visible" name="isVisible" label="Visible" hint="Hidden categories stay in the database." defaultChecked={initial.isVisible} />
      <div>
        <SubmitButton label={submitLabel} pendingLabel="Saving…" />
      </div>
    </form>
  );
}
