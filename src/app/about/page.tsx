import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";
import { aboutContent } from "@/data/editorial";

// Editorial content is static by design; force-dynamic keeps the shared
// header/footer search index fresh from the database on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hype is a furniture studio drawing pieces at full scale and producing them in small batches — solid oak, walnut, stone and woven fibre, delivered by the team that made them.",
};

const values = [
  {
    title: "Craft",
    body: "Full-scale drawings, hand-finished joinery and makers we have worked with for a decade.",
  },
  {
    title: "Quality",
    body: "Solid timber, honed stone and woven fibre — chosen because wear improves them.",
  },
  {
    title: "Simplicity",
    body: "Warm neutrals, honest proportions and no detail that exists only to be photographed.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

        <header className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{aboutContent.eyebrow}</p>
            <h1 className="display-lg mt-4">{aboutContent.title}</h1>
            <p className="lede mt-6 max-w-md">{aboutContent.lead}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/furniture" className="btn btn-solid">
                Explore furniture
                <ArrowRight />
              </Link>
              <Link href="/collections" className="btn btn-outline">
                View collections
              </Link>
            </div>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-7">
            <div className="frame relative aspect-[4/3] lg:aspect-[5/4]">
              <Image
                src={aboutContent.image}
                alt={aboutContent.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="is-primary object-cover"
              />
            </div>
            <div className="mt-5 flex items-start gap-5">
              <div className="frame relative aspect-square w-28 shrink-0 md:w-36">
                <Image
                  src={aboutContent.detailImage}
                  alt={aboutContent.detailImageAlt}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
              <p className="meta normal-case tracking-[0.1em] text-muted">
                Upholstery sampling in the studio — every fabric is sat in, stretched and worn
                before it enters the collection.
              </p>
            </div>
          </Reveal>
        </header>

        <section className="mt-20 border-t border-line pt-10" aria-labelledby="chapters-title">
          <div id="chapters-title" className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">How we work</p>
              <h2 className="display-md mt-4">Four fixed habits.</h2>
            </div>

            <ul className="lg:col-span-8">
              {aboutContent.chapters.map((chapter) => (
                <li
                  key={chapter.number}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-7 md:grid-cols-[4rem_1fr] md:gap-8"
                >
                  <span className="display-sm text-accent">{chapter.number}</span>
                  <div>
                    <h3 className="font-display text-xl font-normal">{chapter.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                      {chapter.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3" aria-label="Studio values">
          {values.map((value, index) => (
            <Reveal key={value.title} delay={index * 70} className="border border-line px-6 py-7">
              <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="display-sm mt-3">{value.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{value.body}</p>
            </Reveal>
          ))}
        </section>

        <section className="mt-16 bg-canvas-deep px-6 py-10 md:px-10" aria-label="Studio facts">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {aboutContent.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="sr-only">{fact.label}</dt>
                <dd>
                  <span className="display-lg block tabular-nums">{fact.value}</span>
                  <span className="meta mt-3 block normal-case tracking-[0.1em] text-ink-soft">
                    {fact.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16 grid items-center gap-8 border-t border-line pt-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="frame relative aspect-[16/9]">
              <Image
                src={aboutContent.portraitImage}
                alt={aboutContent.portraitImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="eyebrow">Visit</p>
            <h2 className="display-md mt-4">The studio is open by appointment.</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Bring a plan of the room and the measurements. We will sit you in everything you are
              considering and tell you when a piece is wrong for the space.
            </p>
            <a href="mailto:studio@hype.furniture" className="btn btn-outline mt-7">
              studio@hype.furniture
              <ArrowRight />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
