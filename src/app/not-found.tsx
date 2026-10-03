import Link from "next/link";
import { ArrowRight } from "@/components/ui/Icons";
import { getPublicCategories } from "@/lib/server/public-catalog";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const categories = await getPublicCategories("furniture");
  return (
    <div className="shell py-20 md:py-32">
      <p className="eyebrow">Error 404</p>
      <h1 className="display-xl mt-5 max-w-3xl">
        This room <span className="italic text-accent">does not exist</span>.
      </h1>
      <p className="lede mt-6 max-w-md">
        The page you were looking for has been moved, renamed or never built. Everything else is
        still where you left it.
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-solid">
          Back home
          <ArrowRight />
        </Link>
        <Link href="/furniture" className="btn btn-outline">
          Browse furniture
        </Link>
      </div>

      <div className="mt-16 border-t border-line pt-8">
        <p className="eyebrow">Or jump straight to a category</p>
        <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/furniture/${category.slug}`}
                className="link-underline text-sm text-ink-soft hover:text-ink"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
