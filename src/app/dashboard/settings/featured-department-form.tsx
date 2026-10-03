"use client";

import { useActionState } from "react";

import type { Department } from "@/data/types";
import type { ActionState } from "@/lib/server/dashboard/action";

import SubmitButton from "../_components/submit-button";

const OPTIONS: { value: Department; label: string; hint: string }[] = [
  {
    value: "furniture",
    label: "Furniture",
    hint: "The curated living-room collection (current behavior).",
  },
  {
    value: "decoration",
    label: "Decoration",
    hint: "Featured-flagged decoration products.",
  },
];

/**
 * Dedicated Homepage Featured Department control. Radio choice between the
 * two catalog departments — no raw JSON editing. The server action
 * re-validates and requires ADMIN; the page refresh shows the new value.
 */
export default function FeaturedDepartmentForm({
  current,
  action,
}: {
  current: Department;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
          Saved. The homepage featured section updates immediately.
        </p>
      ) : null}
      <fieldset>
        <legend className="sr-only">Homepage featured department</legend>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Homepage featured department">
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                current === option.value
                  ? "border-ink bg-canvas-deep"
                  : "border-line bg-canvas hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="department"
                value={option.value}
                defaultChecked={current === option.value}
                className="mt-0.5 h-4 w-4 accent-[#7c5c41]"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">
                  {option.label}
                  {current === option.value ? (
                    <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-canvas">
                      Current
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-muted">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <SubmitButton label="Save selection" pendingLabel="Saving…" />
      </div>
    </form>
  );
}
