"use client";

import { useFormStatus } from "react-dom";

/** Submit button that disables itself while its parent form action runs. */
export default function SubmitButton({
  label,
  pendingLabel = "Saving…",
}: {
  label: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-canvas transition-opacity disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
