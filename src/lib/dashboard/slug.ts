// Pure slug helper. No server-only import by design — used by client-side
// "suggest" buttons and re-validated server-side by `slugSchema`.

/**
 * Suggests a kebab-case slug from a name ("Lume Sofa" → "lume-sofa").
 * Never applied silently: the admin always reviews the slug field, and the
 * server re-validates format + uniqueness on submit.
 */
export function suggestSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 160);
}
