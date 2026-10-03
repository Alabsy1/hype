interface ArrowProps {
  className?: string;
}

export function ArrowRight({ className = "h-3.5 w-3.5" }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M2 8h11.5M9.5 3.5 14 8l-4.5 4.5" />
    </svg>
  );
}

export function ArrowLeft({ className = "h-3.5 w-3.5" }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M14 8H2.5M6.5 3.5 2 8l4.5 4.5" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="7" cy="7" r="4.6" />
      <path d="m10.6 10.6 3.1 3.1" />
    </svg>
  );
}

export function BagIcon({ className = "h-4 w-4" }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M3 5h10l-.8 8.2H3.8L3 5Z" />
      <path d="M6 6.2V4.6a2 2 0 0 1 4 0v1.6" />
    </svg>
  );
}

export function HeartIcon({ className = "h-4 w-4" }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M8 13.2 3.4 8.7A3 3 0 0 1 7.7 4.5L8 4.8l.3-.3a3 3 0 0 1 4.3 4.2L8 13.2Z" />
    </svg>
  );
}

export function ScaleIcon({ className = "h-4 w-4" }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M3 13V6.5M8 13V3.5M13 13V8.5" />
    </svg>
  );
}

export function CloseIcon({ className = "h-4 w-4" }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}
