import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Gauge,
  RotateCcw,
  Settings,
  ShieldQuestion,
  Target,
  UserRound,
} from "lucide-react";

// Labels come from the `account.shell.nav` messages, keyed by `key`.

export const overviewNavigation = [
  { href: "/dashboard", key: "dashboard", icon: Gauge },
] as const;

export const prepareNavigation = [
  { href: "/learn", key: "learn", icon: BookOpen },
  { href: "/practice", key: "practice", icon: Target },
  { href: "/exam", key: "exam", icon: ShieldQuestion },
] as const;

export const trackNavigation = [
  {
    href: "/progress",
    key: "progress",
    icon: ChartNoAxesColumnIncreasing,
  },
  { href: "/mistakes", key: "mistakes", icon: RotateCcw },
] as const;

export const accountNavigation = [
  { href: "/profile", key: "profile", icon: UserRound },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

export const quickNavigation = [
  ...overviewNavigation,
  ...prepareNavigation,
] as const;
