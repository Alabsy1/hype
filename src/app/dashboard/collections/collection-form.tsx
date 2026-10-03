"use client";

import { useActionState, useState } from "react";

import { suggestSlug } from "@/lib/dashboard/slug";
import type { ActionState } from "@/lib/server/dashboard/action";

import { Checkbox, Field, TextArea, TextInput } from "../_components/form-controls";
import SubmitButton from "../_components/submit-button";

export interface CollectionFormInitial {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  isVisible: boolean;
}

interface CollectionFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initial: CollectionFormInitial;
  submitLabel: string;
  isEdit?: boolean;
  entityId?: string;
}

/** Shared create/edit collection form (name / slug / eyebrow / description / visibility). */
export default function CollectionForm({ action, initial, submitLabel, isEdit, entityId }: CollectionFormProps) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5 rounded-2xl border border-line bg-canvas p-5">
      {entityId ? <input type="hidden" name="id" value={entityId} /> : null}
      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      {state.ok && isEdit ? (
        <p role="status" className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
          Saved.
        </p>
      ) : null}

      <Field label="Name" htmlFor="col-name" required>
        <TextInput id="col-name" name="name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Slug" htmlFor="col-slug" required>
        <div className="flex gap-2">
          <TextInput id="col-slug" name="slug" required maxLength={160} value={slug} onChange={(event) => setSlug(event.target.value)} />
          <button
            type="button"
            onClick={() => setSlug(suggestSlug(name))}
            className="shrink-0 rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
          >
            Suggest
          </button>
        </div>
      </Field>
      <Field label="Eyebrow" htmlFor="col-eyebrow" required hint="Short kicker shown above the collection name.">
        <TextInput id="col-eyebrow" name="eyebrow" required maxLength={200} defaultValue={initial.eyebrow} />
      </Field>
      <Field label="Description" htmlFor="col-desc">
        <TextArea id="col-desc" name="description" maxLength={5000} defaultValue={initial.description} rows={3} />
      </Field>
      <Checkbox id="col-visible" name="isVisible" label="Visible" hint="Hidden collections stay in the database." defaultChecked={initial.isVisible} />
      <div>
        <SubmitButton label={submitLabel} pendingLabel="Saving…" />
      </div>
    </form>
  );
}
