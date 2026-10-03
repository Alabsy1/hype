"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight } from "@/components/ui/Icons";

export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [value, setValue] = useState("");
  const id = useId();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="meta text-ink" role="status">
        Address accepted — this preview does not send email or store anything yet.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <div className="flex items-center gap-3 border-b border-line pb-3 focus-within:border-ink">
        <input
          id={id}
          type="email"
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Email address"
          className={`w-full bg-transparent py-2 outline-none placeholder:text-muted/70 ${
            compact ? "text-sm" : "text-base md:text-lg"
          }`}
        />
        <button
          type="submit"
          aria-label="Join the Hype newsletter"
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
        >
          <ArrowRight />
        </button>
      </div>
    </form>
  );
}
