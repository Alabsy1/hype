"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

/**
 * Minimal login form (client component). It only collects credentials and
 * renders the server action's generic error — verification, session creation,
 * and cookies all happen server-side in `loginAction`.
 */
export default function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate={false}>
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-sm font-medium text-ink-soft">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          placeholder="you@studio.com"
          className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="text-sm font-medium text-ink-soft">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          placeholder="••••••••••••"
          className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-xl bg-ink px-4 py-3 text-sm text-canvas">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold uppercase tracking-widest text-canvas transition-opacity disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted">
        New to Hype?{" "}
        <Link href="/register" className="link-underline text-ink">
          Create an account
        </Link>
      </p>
    </form>
  );
}
