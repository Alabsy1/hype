"use client";

import { useActionState, useState } from "react";

import type { ActionState } from "@/lib/server/dashboard/action";
import type { ProductSummaryDTO } from "@/lib/server/dto/product.dto";

import SubmitButton from "../_components/submit-button";

interface AlternativesFormProps {
  productId: string;
  current: ProductSummaryDTO[];
  candidates: ProductSummaryDTO[];
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}

/**
 * Symmetric alternatives editor. The server action rewrites the pair set
 * transactionally (both directions), drops self-references, and rejects
 * unknown ids — the UI only collects the desired member list.
 */
export default function AlternativesForm({ productId, current, candidates, action }: AlternativesFormProps) {
  const [state, formAction] = useActionState(action, { ok: false, error: null });
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>(current.map((item) => item.id));

  const visible = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelected((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="alternativeId" value={id} />
      ))}

      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-soft">
          Alternatives saved.
        </p>
      ) : null}

      <div>
        <label htmlFor="alt-filter" className="text-sm font-medium text-ink-soft">
          Filter products
        </label>
        <input
          id="alt-filter"
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Type to filter…"
          className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink-soft">
          Selected alternatives ({selected.length})
        </legend>
        <ul className="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {visible.map((candidate) => {
            const checked = selected.includes(candidate.id);
            return (
              <li key={candidate.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2 text-sm hover:border-ink">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(candidate.id)}
                    className="h-4 w-4 accent-[#7c5c41]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{candidate.name}</span>
                    <span className="block truncate text-xs text-muted">{candidate.slug}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {visible.length === 0 ? <p className="mt-2 text-sm text-muted">No products match.</p> : null}
      </fieldset>

      <div>
        <SubmitButton label="Save alternatives" pendingLabel="Saving…" />
      </div>
    </form>
  );
}
