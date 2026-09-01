"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm" /><DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-border bg-card p-6 shadow-xl outline-none", className)}>{children}<DialogPrimitive.Close aria-label="Close dialog" className="absolute right-4 top-4 rounded-lg p-2 hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" /></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;
}
export const DialogTitle = ({ children }: { children: React.ReactNode }) => <DialogPrimitive.Title className="pr-8 text-xl font-bold">{children}</DialogPrimitive.Title>;
export const DialogDescription = ({ children }: { children: React.ReactNode }) => <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">{children}</DialogPrimitive.Description>;
