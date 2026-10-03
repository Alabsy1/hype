import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";
import type { EditorialBlock } from "@/data/types";

interface EditorialSplitProps {
  block: EditorialBlock & { secondaryImage?: string; secondaryImageAlt?: string };
  imageAltSecondary?: string;
  reverse?: boolean;
  tone?: "canvas" | "surface";
  layout?: "single" | "stacked";
}

export default function EditorialSplit({
  block,
  reverse = false,
  tone = "canvas",
  layout = "single",
}: EditorialSplitProps) {
  const imageColumn = (
    <Reveal delay={80} className={layout === "stacked" ? "relative lg:col-span-7" : "lg:col-span-7"}>
      <div className="frame aspect-[4/3] lg:aspect-[5/4]">
        <Image
          src={block.image}
          alt={block.imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="is-primary object-cover"
        />
      </div>

      {layout === "stacked" && block.secondaryImage ? (
        <div className="frame relative -mt-16 ml-auto aspect-[4/3] w-1/2 shadow-[0_30px_60px_-45px_rgba(25,23,19,0.9)] lg:-mt-24 lg:w-5/12">
          <Image
            src={block.secondaryImage}
            alt={block.secondaryImageAlt ?? ""}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
      ) : null}
    </Reveal>
  );

  const textColumn = (
    <Reveal className={layout === "stacked" ? "lg:col-span-4 lg:pt-16" : "lg:col-span-5"}>
      <p className="eyebrow">{block.eyebrow}</p>
      <h2 className="display-lg mt-5">{block.title}</h2>
      <p className="lede mt-6 max-w-md">{block.body}</p>
      {block.cta ? (
        <Link href={block.cta.href} className="btn btn-outline mt-9">
          {block.cta.label}
          <ArrowRight />
        </Link>
      ) : null}
    </Reveal>
  );

  return (
    <section
      className={tone === "surface" ? "bg-canvas-deep py-16 md:py-24" : "py-16 md:py-24"}
      aria-labelledby={`editorial-${block.id}`}
    >
      <div className="shell">
        <div
          id={`editorial-${block.id}`}
          className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14"
        >
          {reverse ? (
            <>
              {textColumn}
              {imageColumn}
            </>
          ) : (
            <>
              {imageColumn}
              {textColumn}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
