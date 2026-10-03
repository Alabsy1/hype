import { redirect } from "next/navigation";
import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { getCurrentUser } from "@/lib/server/auth/authorization";

export const metadata = {
  title: "Account",
  description: "Your Hype account.",
};

export const dynamic = "force-dynamic";

/**
 * Minimal account surface: identity + status for any authenticated user.
 * Exposes nothing sensitive (no hashes, tokens, or internal ids).
 */
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnTo=/account");
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-16 sm:py-24">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          Hype Studio
        </p>
        <h1 className="font-display text-4xl text-ink">Account</h1>
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-canvas-deep p-6 sm:p-8">
        <dl className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
            <dt className="text-sm text-muted">Name</dt>
            <dd className="text-right text-sm font-medium text-ink">{user.name ?? "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
            <dt className="text-sm text-muted">Email</dt>
            <dd className="break-all text-right text-sm font-medium text-ink">{user.email}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
            <dt className="text-sm text-muted">Role</dt>
            <dd className="text-right text-sm font-medium text-ink">{user.role}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <dt className="text-sm text-muted">Status</dt>
            <dd className="text-right text-sm font-medium text-ink">Active</dd>
          </div>
        </dl>
        {user.role === "ADMIN" ? (
          <Link
            href="/dashboard"
            className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold uppercase tracking-widest text-canvas"
          >
            Open dashboard
          </Link>
        ) : null}
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm font-semibold uppercase tracking-widest text-ink-soft hover:border-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
