/**
 * Graceful database-unavailable state. Rendered when a dashboard section
 * cannot reach PostgreSQL (DATABASE_URL may be absent). Never exposes
 * connection details — internal admin audience only, no fake data.
 */
export default function DbUnavailable({ section }: { section: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
        Database unavailable
      </p>
      <h2 className="mt-2 font-display text-2xl text-ink">Connection is not configured</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {section} needs a live PostgreSQL connection. Set <code>DATABASE_URL</code> in the
        server environment and reload — nothing here is stored or faked until then.
      </p>
    </div>
  );
}

export function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Error</p>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-canvas p-8 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
