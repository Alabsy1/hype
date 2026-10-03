import { tickerItems } from "@/data/editorial";

export default function Ticker() {
  const items = [...tickerItems, ...tickerItems];

  return (
    <div className="border-y border-line bg-canvas-deep py-3.5">
      <div className="flex overflow-hidden" aria-hidden="true">
        <div className="animate-marquee flex shrink-0 items-center gap-8 whitespace-nowrap pr-8">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="meta flex items-center gap-8 text-ink-soft"
            >
              {item}
              <span className="text-accent">✳</span>
            </span>
          ))}
        </div>
        <div className="animate-marquee flex shrink-0 items-center gap-8 whitespace-nowrap pr-8">
          {items.map((item, index) => (
            <span
              key={`second-${item}-${index}`}
              className="meta flex items-center gap-8 text-ink-soft"
            >
              {item}
              <span className="text-accent">✳</span>
            </span>
          ))}
        </div>
      </div>
      <span className="sr-only">
        Categories: {tickerItems.join(", ")}
      </span>
    </div>
  );
}
