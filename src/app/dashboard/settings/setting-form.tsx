"use client";

import { useActionState } from "react";

import type { ActionState } from "@/lib/server/dashboard/action";

import { Field, TextArea, TextInput } from "../_components/form-controls";
import SubmitButton from "../_components/submit-button";

/** Inline setting editor (JSON value) or creator when no setting exists. */
export default function SettingForm({
  settingKey,
  initialValue,
  action,
  submitLabel,
}: {
  settingKey: string;
  initialValue: string;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="key" value={settingKey} />
      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
          Saved.
        </p>
      ) : null}
      <Field label={`Value — ${settingKey}`} htmlFor={`setting-${settingKey}`} hint="Valid JSON only.">
        <TextArea
          id={`setting-${settingKey}`}
          name="value"
          required
          rows={4}
          defaultValue={initialValue}
          className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 font-mono text-xs text-ink focus:border-ink focus:outline-none"
        />
      </Field>
      <div>
        <SubmitButton label={submitLabel} pendingLabel="Saving…" />
      </div>
    </form>
  );
}

/** Creator for a brand-new setting key. */
export function NewSettingForm({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
      <h2 className="font-display text-xl text-ink">New setting</h2>
      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
          Saved.
        </p>
      ) : null}
      <Field label="Key" htmlFor="new-setting-key" hint="Letters, numbers, dot, dash, underscore.">
        <TextInput id="new-setting-key" name="key" required maxLength={128} placeholder="ticker.items" />
      </Field>
      <Field label="Value" htmlFor="new-setting-value" hint="Valid JSON only.">
        <TextArea
          id="new-setting-value"
          name="value"
          required
          rows={3}
          placeholder='["Free delivery over $500"]'
          className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 font-mono text-xs text-ink focus:border-ink focus:outline-none"
        />
      </Field>
      <div>
        <SubmitButton label="Create setting" pendingLabel="Saving…" />
      </div>
    </form>
  );
}
