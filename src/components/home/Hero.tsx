import Image from "next/image";
import Link from "next/link";
import { heroContent } from "@/data/editorial";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";

export default function Hero() {
  return (
    <section className="shell pb-16 pt-8 md:pb-24 md:pt-12" aria-labelledby="hero-title">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <Reveal className="lg:col-span-5 xl:col-span-4">
          <p className="eyebrow">{heroContent.eyebrow}</p>
          <h1 id="hero-title" className="display-xl mt-5">
            Furniture that
            <br />
            sets the{" "}
            <span className="italic text-accent">mood</span>.
          </h1>
          <p className="lede mt-7 max-w-md">{heroContent.body}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={heroContent.primaryCta.href} className="btn btn-solid">
              {heroContent.primaryCta.label}
              <ArrowRight />
            </Link>
            <Link href={heroContent.secondaryCta.href} className="btn btn-outline">
              {heroContent.secondaryCta.label}
            </Link>
          </div>

          <dl className="mt-12 grid max-w-sm grid-cols-3 gap-4 border-t border-line pt-6">
            <div>
              <dt className="meta normal-case tracking-[0.08em]">Pieces</dt>
              <dd className="mt-1 font-display text-xl">24</dd>
            </div>
            <div>
              <dt className="meta normal-case tracking-[0.08em]">Categories</dt>
              <dd className="mt-1 font-display text-xl">10</dd>
            </div>
            <div>
              <dt className="meta normal-case tracking-[0.08em]">Batches</dt>
              <dd className="mt-1 font-display text-xl">40–80</dd>
            </div>
          </dl>
        </Reveal>

        <div className="lg:col-span-7 xl:col-span-8">
          <Reveal delay={120} className="relative">
            <div className="frame aspect-[4/3] md:aspect-[16/10] lg:aspect-[5/4]">
              <Image
                src={heroContent.image}
                alt={heroContent.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="is-primary object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
            </div>

            <div className="frame absolute -bottom-10 -left-4 hidden aspect-[3/4] w-40 shadow-[0_30px_60px_-40px_rgba(25,23,19,0.8)] sm:block md:-left-6 md:w-52 lg:-left-10 lg:w-60">
              <Image
                src={heroContent.portrait}
                alt={heroContent.portraitAlt}
                fill
                sizes="(max-width: 768px) 160px, 240px"
                className="object-cover"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-6">
              <p className="meta normal-case tracking-[0.1em]">{heroContent.caption}</p>
              <span aria-hidden="true" className="hidden h-px flex-1 bg-line md:block" />
              <p className="meta hidden tabular-nums md:block">01 / 04</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
