import Link from "next/link";
import { ArrowRight } from "@/components/ui/Icons";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  align?: "start" | "between";
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "between",
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col gap-6 ${
        align === "between" ? "md:flex-row md:items-end md:justify-between" : "md:items-start"
      }`}
    >
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display-lg mt-4">{title}</h2>
        {description ? <p className="lede mt-4 max-w-xl">{description}</p> : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="link-underline meta shrink-0 text-ink hover:text-accent"
        >
          <span className="inline-flex items-center gap-2">
            {action.label}
            <ArrowRight />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
