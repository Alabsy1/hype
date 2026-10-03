import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";

interface FullBleedProps {
  block: {
    eyebrow: string;
    title: string;
    body: string;
    image: string;
    imageAlt: string;
    cta?: { label: string; href: string };
  };
  label?: string;
}

export default function FullBleed({ block, label }: FullBleedProps) {
  return (
    <section className="relative py-4 md:py-8" aria-labelledby={`bleed-${block.title}`}>
      <Reveal>
        <div className="frame relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src={block.image}
            alt={block.imageAlt}
            fill
            sizes="100vw"
            className="is-primary object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/25 to-transparent" />

          <div className="absolute inset-0 flex items-end">
            <div className="shell pb-8 md:pb-14 lg:pb-20">
              <div className="max-w-xl text-canvas">
                <p className="text-[0.65rem] uppercase tracking-[0.24em] text-canvas/75">
                  {block.eyebrow}
                </p>
                <h2 id={`bleed-${block.title}`} className="display-lg mt-4">
                  {block.title}
                </h2>
                <p className="mt-4 hidden max-w-md text-sm leading-relaxed text-canvas/85 md:block">
                  {block.body}
                </p>
                {block.cta ? (
                  <Link
                    href={block.cta.href}
                    className="mt-7 inline-flex items-center gap-2 border border-canvas/60 px-6 py-3.5 text-[0.7rem] uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-canvas hover:text-ink"
                  >
                    {block.cta.label}
                    <ArrowRight />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {label ? (
            <span className="absolute right-4 top-4 bg-canvas px-4 py-2 text-[0.68rem] uppercase tracking-[0.18em] text-ink md:right-8 md:top-8">
              {label}
            </span>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
