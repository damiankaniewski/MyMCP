import { cn } from "@/lib/utils";

// Thin wrapper around Font Awesome 6 (loaded via CDN in index.html).
// Usage: <Icon name="wrench" />, <Icon name="circle" regular />, <Icon name="github" brand />
export function Icon({
  name,
  regular = false,
  brand = false,
  className,
}: {
  name: string;
  regular?: boolean;
  brand?: boolean;
  className?: string;
}) {
  const style = brand ? "fa-brands" : regular ? "fa-regular" : "fa-solid";
  return (
    <i className={cn(style, `fa-${name}`, className)} aria-hidden="true" />
  );
}
