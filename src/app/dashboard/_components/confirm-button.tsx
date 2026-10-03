"use client";

import { useState } from "react";

/**
 * Two-step destructive-action button for use inside a `<form action={...}>`.
 * First click arms (no submission), second click submits. Keyboard accessible,
 * real `<button>` elements, cancellable.
 */
export default function ConfirmButton({
  label,
  confirmLabel,
  tone = "danger",
}: {
  label: string;
  confirmLabel: string;
  tone?: "danger" | "neutral";
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className={
          tone === "danger"
            ? "rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
            : "rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
        }
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="submit"
        className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-canvas"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
      >
        Keep
      </button>
    </span>
  );
}
