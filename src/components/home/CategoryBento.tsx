import CategoryTile from "@/components/categories/CategoryTile";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Category } from "@/data/types";

const layout = [
  "lg:col-span-5 lg:row-span-2",
  "lg:col-span-4 lg:mt-12",
  "lg:col-span-3 lg:mt-24",
  "lg:col-span-4",
  "lg:col-span-4 lg:mt-10",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-3 lg:mt-8",
  "lg:col-span-3",
  "lg:col-span-3 lg:mt-8",
];

const ratios = [
  "aspect-[4/5]",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[4/3]",
];

export default function CategoryBento({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  return (
    <section className="shell py-16 md:py-24" aria-labelledby="categories-title">
      <div id="categories-title">
        <SectionHeading
          eyebrow="Category exploration"
          title="Ten ways to fill a room."
          description="Every category has its own edit — photographed, described and priced the same way, so moving between them feels like one continuous room."
          action={{ label: "All furniture", href: "/furniture" }}
        />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
        {categories.map((category, index) => (
          <Reveal
            key={category.slug}
            delay={index * 45}
            className={`${layout[index] ?? ""} ${index === 0 ? "sm:col-span-2 lg:col-span-5" : ""}`}
          >
            <CategoryTile
              category={category}
              count={counts[category.slug] ?? 0}
              className={ratios[index] ?? "aspect-[4/3]"}
              sizes={
                index === 0
                  ? "(max-width: 1024px) 90vw, 40vw"
                  : "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 26vw"
              }
              priority={index < 2}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
