import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/ui/Icons";
import type { Category } from "@/data/types";

interface CategoryTileProps {
  category: Category;
  count: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Route prefix for the category page. Defaults to the furniture catalog. */
  basePath?: string;
}

export default function CategoryTile({
  category,
  count,
  className = "",
  sizes = "(max-width: 768px) 90vw, 33vw",
  priority = false,
  basePath = "/furniture",
}: CategoryTileProps) {
  return (
    <Link
      href={`${basePath}/${category.slug}`}
      className={`group relative block ${className}`}
      aria-label={`${category.name}, ${count} pieces`}
    >
      <div className="frame relative h-full min-h-[15rem]">
        <Image
          src={category.image}
          alt={`${category.name} collection`}
          fill
          sizes={sizes}
          priority={priority}
          className="is-primary object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-transparent transition-opacity duration-500 group-hover:from-ink/70" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-canvas md:p-6">
          <div className="min-w-0 translate-y-0 transition-transform duration-500 group-hover:-translate-y-1">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-canvas/75">
              {category.tagline}
            </p>
            <h3 className="display-sm mt-1.5">{category.name}</h3>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-canvas/70 tabular-nums">
              {count}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-canvas/45 text-canvas opacity-0 transition-all duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
              <ArrowRight />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
