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

export const overviewNavigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    labelFr: "Tableau de bord",
    icon: Gauge,
  },
] as const;

export const prepareNavigation = [
  { href: "/learn", label: "Learn", labelFr: "Apprendre", icon: BookOpen },
  { href: "/practice", label: "Practice", labelFr: "Pratiquer", icon: Target },
  {
    href: "/exam",
    label: "Mock Exams",
    labelFr: "Examens blancs",
    icon: ShieldQuestion,
  },
] as const;

export const trackNavigation = [
  {
    href: "/progress",
    label: "Progress",
    labelFr: "Progrès",
    icon: ChartNoAxesColumnIncreasing,
  },
  { href: "/mistakes", label: "Mistakes", labelFr: "Erreurs", icon: RotateCcw },
] as const;

export const accountNavigation = [
  { href: "/profile", label: "Profile", labelFr: "Profil", icon: UserRound },
  {
    href: "/settings",
    label: "Settings",
    labelFr: "Paramètres",
    icon: Settings,
  },
] as const;

export const quickNavigation = [
  ...overviewNavigation,
  ...prepareNavigation,
] as const;
