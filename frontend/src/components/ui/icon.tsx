import { cn } from "@/lib/utils";

// Thin wrapper around Font Awesome 6 (loaded via CDN in index.html).
// Usage: <Icon name="wrench" /> or <Icon name="circle" regular className="text-lg" />
export function Icon({
  name,
  regular = false,
  className,
}: {
  name: string;
  regular?: boolean;
  className?: string;
}) {
  return (
    <i
      className={cn(regular ? "fa-regular" : "fa-solid", `fa-${name}`, className)}
      aria-hidden="true"
    />
  );
}
