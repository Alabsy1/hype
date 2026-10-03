"use client";

import { useActionState } from "react";

import type { ActionState } from "@/lib/server/dashboard/action";
import type { DepartmentDTO } from "@/lib/server/dto/department.dto";

import { VisibilityBadge } from "../_components/badges";
import { Checkbox, Field, TextInput } from "../_components/form-controls";
import SubmitButton from "../_components/submit-button";

/** Inline department editor (name / order / visibility toggle). */
export default function DepartmentRowForm({
  department,
  action,
}: {
  department: DepartmentDTO;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
      <input type="hidden" name="id" value={department.id} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-ink">
          {department.name} <span className="text-xs text-muted">({department.slug})</span>
        </p>
        <VisibilityBadge isVisible={department.isVisible} />
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`dept-name-${department.id}`} required>
          <TextInput id={`dept-name-${department.id}`} name="name" required maxLength={120} defaultValue={department.name} />
        </Field>
        <Field label="Order" htmlFor={`dept-order-${department.id}`} hint="Lower appears first.">
          <TextInput id={`dept-order-${department.id}`} name="order" inputMode="numeric" defaultValue={String(department.order)} />
        </Field>
      </div>
      <Checkbox
        id={`dept-visible-${department.id}`}
        name="isVisible"
        label="Visible on the future public site"
        hint="Hiding never deletes products or categories."
        defaultChecked={department.isVisible}
      />
      <div>
        <SubmitButton label="Save department" pendingLabel="Saving…" />
      </div>
    </form>
  );
}
