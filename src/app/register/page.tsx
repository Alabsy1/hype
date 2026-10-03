import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth/authorization";

import RegisterForm from "./register-form";

export const metadata = {
  title: "Create account",
  description: "Create a Hype customer account.",
};

export const dynamic = "force-dynamic";

/**
 * Public sign-up page. Already-authenticated users are sent home instead of
 * seeing the form again. Creates CUSTOMER accounts only (see registerAction).
 */
export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-16 sm:py-24">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          Hype Studio
        </p>
        <h1 className="font-display text-4xl text-ink">Create account</h1>
        <p className="text-sm text-muted">Save pieces, check out faster, stay in the loop.</p>
      </div>
      <div className="rounded-2xl border border-line bg-canvas-deep p-6 sm:p-8">
        <RegisterForm />
      </div>
    </section>
  );
}
