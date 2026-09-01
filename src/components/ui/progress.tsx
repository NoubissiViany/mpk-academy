import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className, label }: { value?: number; className?: string; label: string }) {
  return <ProgressPrimitive.Root aria-label={label} value={value} className={cn("relative h-2.5 overflow-hidden rounded-full bg-muted", className)}><ProgressPrimitive.Indicator className="h-full rounded-full bg-primary transition-transform" style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }} /></ProgressPrimitive.Root>;
}
