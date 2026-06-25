import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "green" | "red" | "indigo" | "amber";

// Monochrome only: differentiate by weight (solid vs light vs outlined),
// never by hue.
const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  green: "bg-slate-900 text-white",
  red: "border border-slate-900 text-slate-900",
  indigo: "bg-slate-200 text-slate-800",
  amber: "border border-slate-400 text-slate-600",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
