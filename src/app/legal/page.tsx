import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

// Static legal copy; force-dynamic keeps the shared header/footer search
// index fresh from the database on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Legal & privacy",
  description:
    "How this front-end preview handles your data: no accounts, no payments, no servers — local storage only for your comparison selection.",
};

const sections = [
  {
    id: "scope",
    title: "Scope of this site",
    body: "This is a front-end preview of the Hype brand experience. Product information, prices, availability and imagery are sample content held in the codebase. There is no checkout, no account system and no order processing behind it.",
  },
  {
    id: "storage",
    title: "What is stored",
    body: "Your comparison selection is saved in your browser's local storage under the key “hype:compare” so that it survives a reload. It never leaves your device, is not sent anywhere, and can be cleared at any time from the comparison table or by clearing site data.",
  },
  {
    id: "forms",
    title: "Forms",
    body: "Newsletter and notification forms validate your email address on screen only. Nothing is transmitted, subscribed or recorded. A production release would connect these to a mailing service with explicit consent.",
  },
  {
    id: "imagery",
    title: "Imagery & content",
    body: "Photography and copy in this preview are used to demonstrate layout and art direction. Descriptions of materials, dimensions and pricing are illustrative.",
  },
  {
    id: "cookies",
    title: "Cookies & analytics",
    body: "No analytics, advertising or tracking scripts are loaded. No cookies are set by this preview.",
  },
  {
    id: "contact",
    title: "Questions",
    body: "For anything about this preview or the studio behind it, write to studio@hype.furniture.",
  },
];

export default function LegalPage() {
  return (
    <div className="shell py-12 md:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Legal" }]} />

      <header className="mt-6 grid gap-6 border-b border-line pb-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Plain language</p>
          <h1 className="display-lg mt-4">Legal & privacy.</h1>
        </div>
        <p className="lede lg:col-span-5 lg:pt-9">
          Short version: this preview runs entirely in your browser. No accounts, no payments, no
          servers, no tracking.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <nav aria-label="On this page" className="lg:col-span-3">
          <ul className="space-y-2.5 lg:sticky lg:top-28">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="link-underline meta text-ink-soft hover:text-ink"
                >
                  {String(index + 1).padStart(2, "0")} — {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-9">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="border-b border-line py-8">
              <h2 className="display-sm">{section.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{section.body}</p>
            </section>
          ))}
          <p className="meta mt-8 normal-case tracking-[0.1em] text-muted">
            Last updated September 2026 — this document describes the preview build only.
          </p>
        </div>
      </div>
    </div>
  );
}
