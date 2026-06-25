import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "green" | "red" | "indigo" | "amber";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  indigo: "bg-brand-100 text-brand-700",
  amber: "bg-amber-100 text-amber-700",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
