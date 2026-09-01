import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15", className)} {...props} />; }
