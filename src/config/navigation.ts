import { BookOpen, ChartNoAxesColumnIncreasing, Gauge, GraduationCap, Settings, ShieldQuestion, Target } from "lucide-react";

export const studentNavigation = [
  { href: "/dashboard", label: "Dashboard", labelFr: "Tableau de bord", icon: Gauge },
  { href: "/learn", label: "Learn", labelFr: "Apprendre", icon: BookOpen },
  { href: "/practice", label: "Practice", labelFr: "Pratiquer", icon: Target },
  { href: "/exam", label: "Exam", labelFr: "Examen", icon: ShieldQuestion },
  { href: "/weaknesses", label: "Weaknesses", labelFr: "Faiblesses", icon: ChartNoAxesColumnIncreasing },
  { href: "/progress", label: "Progress", labelFr: "Progrès", icon: GraduationCap },
] as const;

export const secondaryNavigation = [
  { href: "/certificate", label: "Certificate", labelFr: "Certificat", icon: GraduationCap },
  { href: "/settings", label: "Settings", labelFr: "Paramètres", icon: Settings },
] as const;
