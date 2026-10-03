"use client";

import { useActionState } from "react";

import type { ActionState } from "@/lib/server/dashboard/action";

import { Field, TextInput } from "../_components/form-controls";
import SubmitButton from "../_components/submit-button";

export interface MediaFormInitial {
  storageUrl: string;
  mimeType: string;
  sizeBytes: string;
  width: string;
  height: string;
  altText: string;
}

interface MediaFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initial: MediaFormInitial;
  submitLabel: string;
  isEdit?: boolean;
  entityId?: string;
}

/** Metadata-only media form. Upload infrastructure is deferred (see hint). */
export default function MediaForm({ action, initial, submitLabel, isEdit, entityId }: MediaFormProps) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });

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

      <Field
        label="Storage URL"
        htmlFor="media-url"
        required
        hint="Existing URL or reference only (e.g. /images/sofa.jpg). No file uploads in this phase."
      >
        <TextInput id="media-url" name="storageUrl" required maxLength={2000} defaultValue={initial.storageUrl} placeholder="/images/example.jpg" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="MIME type" htmlFor="media-mime" required>
          <TextInput id="media-mime" name="mimeType" required maxLength={100} defaultValue={initial.mimeType} placeholder="image/jpeg" />
        </Field>
        <Field label="File size (bytes)" htmlFor="media-size" required>
          <TextInput id="media-size" name="sizeBytes" required inputMode="numeric" defaultValue={initial.sizeBytes} placeholder="123456" />
        </Field>
        <Field label="Width (px)" htmlFor="media-w" hint="Optional.">
          <TextInput id="media-w" name="width" inputMode="numeric" defaultValue={initial.width} />
        </Field>
        <Field label="Height (px)" htmlFor="media-h" hint="Optional.">
          <TextInput id="media-h" name="height" inputMode="numeric" defaultValue={initial.height} />
        </Field>
      </div>
      <Field label="Alt text" htmlFor="media-alt">
        <TextInput id="media-alt" name="altText" maxLength={300} defaultValue={initial.altText} />
      </Field>
      <div>
        <SubmitButton label={submitLabel} pendingLabel="Saving…" />
      </div>
    </form>
  );
}
