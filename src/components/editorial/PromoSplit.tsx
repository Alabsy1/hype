import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";

export interface PromoSplitProps {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  cta?: { label: string; href: string };
  points?: string[];
  note?: string;
  tone?: "canvas" | "deep";
  reverse?: boolean;
}

export default function PromoSplit({
  eyebrow,
  title,
  body,
  image,
  imageAlt,
  cta,
  points,
  note,
  tone = "canvas",
  reverse = false,
}: PromoSplitProps) {
  return (
    <section
      className={tone === "deep" ? "bg-surface py-16 md:py-24" : "py-16 md:py-24"}
      aria-labelledby={`promo-${eyebrow}`}
    >
      <div className="shell">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className={reverse ? "lg:order-2 lg:col-span-5" : "lg:col-span-5"}>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={`promo-${eyebrow}`} className="display-lg mt-5">
              {title}
            </h2>
            <p className="lede mt-6 max-w-md">{body}</p>

            {points ? (
              <ul className="mt-8 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex items-baseline gap-3 text-sm text-ink-soft">
                    <span aria-hidden="true" className="text-accent">
                      ✳
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}

            {cta ? (
              <Link href={cta.href} className="btn btn-solid mt-9">
                {cta.label}
                <ArrowRight />
              </Link>
            ) : null}

            {note ? <p className="meta mt-6 normal-case tracking-[0.1em]">{note}</p> : null}
          </Reveal>

          <Reveal delay={100} className={reverse ? "lg:order-1 lg:col-span-7" : "lg:col-span-7"}>
            <div className="frame aspect-[4/3] lg:aspect-[16/11]">
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="is-primary object-cover"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
