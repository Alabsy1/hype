import { redirect } from "next/navigation";

import { logoutAction } from "@/app/login/actions";
import { getCurrentUser, hasRole } from "@/lib/server/auth/authorization";

import DashboardNav from "./dashboard-nav";

/**
 * Protected dashboard shell. Every route under /dashboard renders inside this
 * layout, so the gate below covers all dashboard pages (they cannot bypass
 * it). Server Actions remain independently protected via requireAdmin().
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=/dashboard");
  }

  if (!hasRole(user, "ADMIN")) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16 text-center sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          403 — Forbidden
        </p>
        <h1 className="font-display text-4xl text-ink">Access denied</h1>
        <p className="text-sm text-muted">
          Signed in as {user.email} ({user.role}). This area requires an administrator.
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold uppercase tracking-widest text-canvas"
          >
            Sign out
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className="bg-canvas-deep text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-8">
        <aside className="flex flex-col gap-4 md:sticky md:top-6 md:h-fit md:w-64 md:shrink-0 md:rounded-2xl md:border md:border-line md:bg-canvas md:p-4">
          <div className="hidden md:block">
            <p className="px-4 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Hype Admin
            </p>
          </div>
          <DashboardNav />
          <div className="hidden flex-col gap-3 border-t border-line px-4 pt-4 md:flex">
            <div className="flex flex-col gap-0.5">
              <p className="truncate text-sm font-medium text-ink">{user.name ?? user.email}</p>
              <p className="truncate text-xs text-muted">
                {user.email} · {user.role}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-xl border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink-soft hover:border-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
