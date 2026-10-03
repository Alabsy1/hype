"use client";

import Link from "next/link";
import { useCompare } from "@/components/compare/CompareProvider";
import { ScaleIcon } from "@/components/ui/Icons";

interface CompareToggleProps {
  slug: string;
  compact?: boolean;
}

export function CompareToggle({ slug, compact = false }: CompareToggleProps) {
  const { has, toggle, isFull, items } = useCompare();
  const selected = has(slug);
  const disabled = !selected && isFull;

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={disabled}
      aria-pressed={selected}
      title={
        disabled
          ? `Comparison holds up to 4 pieces (${items.length}/4 selected)`
          : selected
            ? "Remove from comparison"
            : "Add to comparison"
      }
      className={`inline-flex items-center gap-2 border px-4 py-3 text-[0.68rem] uppercase tracking-[0.16em] transition-colors ${
        selected
          ? "border-ink bg-ink text-canvas"
          : "border-line text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      } ${compact ? "px-3 py-2 text-[0.65rem]" : ""}`}
    >
      <ScaleIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {selected ? "In comparison" : "Add to compare"}
    </button>
  );
}

export function CompareLink({ className = "" }: { className?: string }) {
  const { items } = useCompare();

  return (
    <Link
      href="/compare"
      className={`link-underline meta items-center gap-2 text-ink hover:text-accent ${className}`}
    >
      Compare
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-line px-1 text-[0.65rem] tabular-nums">
        {items.length}
      </span>
    </Link>
  );
}
