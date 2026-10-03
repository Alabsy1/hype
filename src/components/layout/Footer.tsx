import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import { getPublicCategories } from "@/lib/server/public-catalog";

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Compare", href: "/compare" },
  { label: "Legal & privacy", href: "/legal" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/hype_decor_eg?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==" },
  { label: "ABSYCODE", href: "https://absy-portfolio-4yti.vercel.app/" },
];

export default async function Footer() {
  const year = 2026;
  // Visible furniture categories only — hidden categories drop out of the
  // footer automatically. Order preserved from the database.
  const categories = await getPublicCategories("furniture");

  return (
    <footer className="mt-24 border-t border-line bg-canvas-deep md:mt-32">
      <div className="shell py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-baseline gap-2 py-2 -my-2"
              aria-label="Hype — home"
            >
              <span className="text-2xl font-medium uppercase leading-none tracking-[0.3em]">
                Hype
              </span>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted">furniture</span>
            </Link>
            <p className="lede mt-5 max-w-xs">
              Modern furniture in warm neutrals, drawn at full scale and made in small batches.
            </p>
            <p className="meta mt-6 normal-case tracking-[0.1em]">
              Hurghada, Egypt
            </p>
          </div>

          <nav aria-label="Furniture categories">
            <p className="eyebrow">Furniture</p>
            <ul className="mt-5 space-y-2.5">
              {categories.slice(0, 6).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/furniture/${category.slug}`}
                    className="link-underline text-sm text-ink-soft hover:text-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/furniture" className="link-underline text-sm text-accent">
                  All furniture
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <p className="eyebrow">Studio</p>
            <ul className="mt-5 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline text-sm text-ink-soft hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:studio@hype.furniture"
                  className="link-underline text-sm text-ink-soft hover:text-ink"
                >
                  studio@hype.furniture
                </a>
              </li>
            </ul>

            <p className="eyebrow mt-8">Decoration</p>
            <p className="mt-4 text-sm text-muted">
              Now live.{" "}
              <Link href="/decoration" className="link-underline text-accent">
                Explore decoration
              </Link>
              .
            </p>
          </nav>

          <div>
            <p className="eyebrow">Letters from the studio</p>
            <p className="mt-5 text-sm leading-relaxed text-ink-soft">
              New pieces, editions and the occasional open-studio invitation. No noise.
            </p>
            <div className="mt-5">
              <NewsletterForm compact />
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline meta text-ink-soft hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rule mt-14 flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
            © {year} Hype Furniture — all rights reserved
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/legal" className="link-underline meta hover:text-ink">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/legal" className="link-underline meta hover:text-ink">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/about" className="link-underline meta hover:text-ink">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="overflow-hidden border-t border-line/70 pb-8 pt-10" aria-hidden="true">
        <p className="display-xl select-none whitespace-nowrap text-center text-ink/8">
          Hype — Furniture that sets the mood.
        </p>
      </div>
    </footer>
  );
}
