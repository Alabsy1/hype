"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "@/components/ui/Icons";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const total = images.length;

  const move = useCallback(
    (direction: 1 | -1) =>
      setActive((current) => (current + direction + total) % total),
    [total],
  );

  return (
    <div>
      <div className="frame relative aspect-[4/3] overflow-hidden bg-surface md:aspect-[5/4]">
        {images.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt={index === 0 ? `${name} — view ${index + 1}` : `${name} — view ${index + 1}`}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className={`object-cover transition-opacity duration-500 ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <span className="pointer-events-none absolute left-4 top-4 bg-canvas/92 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] tabular-nums">
          {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>

        {total > 1 ? (
          <div className="absolute inset-x-4 bottom-4 flex justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous image"
              className="flex h-10 w-10 items-center justify-center bg-canvas/92 text-ink transition-colors hover:bg-ink hover:text-canvas"
            >
              <ArrowLeft />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next image"
              className="flex h-10 w-10 items-center justify-center bg-canvas/92 text-ink transition-colors hover:bg-ink hover:text-canvas"
            >
              <ArrowRight />
            </button>
          </div>
        ) : null}
      </div>

      {total > 1 ? (
        <ul className="mt-4 flex gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <li key={image} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show view ${index + 1} of ${name}`}
                aria-current={index === active}
                className={`frame relative block aspect-square w-16 transition-all md:w-20 ${
                  index === active ? "outline outline-1 outline-ink" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
