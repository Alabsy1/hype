const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-surface-deep text-ink-soft",
  PUBLISHED: "bg-ink text-canvas",
  ARCHIVED: "bg-canvas-deep text-muted",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  MADE_TO_ORDER: "Made to order",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-surface-deep text-ink-soft"}`}
    >
      {status}
    </span>
  );
}

export function AvailabilityBadge({ availability }: { availability: string }) {
  return (
    <span className="inline-block rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink-soft">
      {AVAILABILITY_LABELS[availability] ?? availability}
    </span>
  );
}

export function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${isVisible ? "bg-ink text-canvas" : "bg-surface-deep text-muted"}`}
    >
      {isVisible ? "Visible" : "Hidden"}
    </span>
  );
}

export function FlagBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-line bg-canvas px-2 py-0.5 text-xs font-medium text-ink-soft">
      {label}
    </span>
  );
}
