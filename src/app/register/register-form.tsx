"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = { error: null };

/**
 * Public sign-up form (client component). Collects name/email/password only —
 * there is no role input. Validation, hashing, session creation, and cookies
 * all happen server-side in `registerAction`.
 */
export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate={false}>
      <div className="flex flex-col gap-2">
        <label htmlFor="register-name" className="text-sm font-medium text-ink-soft">
          Name
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          placeholder="Ava Lindqvist"
          className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="register-email" className="text-sm font-medium text-ink-soft">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="register-password" className="text-sm font-medium text-ink-soft">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          placeholder="At least 12 characters"
          className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="register-confirm" className="text-sm font-medium text-ink-soft">
          Confirm password
        </label>
        <input
          id="register-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          placeholder="Repeat your password"
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
        {isPending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="link-underline text-ink">
          Sign in
        </Link>
      </p>
    </form>
  );
}
