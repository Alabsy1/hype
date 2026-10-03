import { redirect } from "next/navigation";

import { getCurrentUser, getPostLoginRedirect, getSafeRedirect } from "@/lib/server/auth/authorization";

import LoginForm from "./login-form";

export const metadata = {
  title: "Login",
  description: "Sign in to Hype.",
};

/**
 * Single login page for the whole site. Already-authenticated users are sent
 * on to their destination instead of seeing the form again.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = getSafeRedirect(rawReturnTo);

  const user = await getCurrentUser();
  if (user) {
    redirect(getPostLoginRedirect(user, rawReturnTo));
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-16 sm:py-24">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          Hype Studio
        </p>
        <h1 className="font-display text-4xl text-ink">Sign in</h1>
        <p className="text-sm text-muted">Welcome back to Hype.</p>
      </div>
      <div className="rounded-2xl border border-line bg-canvas-deep p-6 sm:p-8">
        <LoginForm returnTo={returnTo} />
      </div>
    </section>
  );
}
