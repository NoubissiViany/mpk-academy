import { Progress } from "@/components/ui/progress";

/** A progress bar with a marker at the goal. */
export function TargetBar({
  value,
  goal,
  label,
  goalLabel,
}: {
  value: number | null;
  goal: number;
  label: string;
  goalLabel: string;
}) {
  return (
    <div className="relative">
      <Progress value={value ?? 0} label={label} />
      <span
        aria-hidden="true"
        className="absolute -top-1 h-[18px] w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
        style={{ left: `${goal}%` }}
      />
      <span className="sr-only">{goalLabel}</span>
    </div>
  );
}
