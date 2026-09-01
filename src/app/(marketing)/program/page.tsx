import Link from "next/link";
import { Clock3, LockKeyhole } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { courseModules } from "@/data/course";

export const metadata = { title: "Program", description: "Explore the MPK Academy TEF/TCF preparation curriculum." };
export default function ProgramPage() { return <div className="container-page py-16"><PageHeader eyebrow="French for Canadian immigration" title="A structured path from foundations to exam performance." description="Eight focused modules combine clear instruction, targeted practice, and French-first simulation. The curriculum adapts to the evidence in your work." action={<Button asChild><Link href="/diagnostic">Start free diagnostic</Link></Button>} /><div className="space-y-4">{courseModules.map((module) => <Card key={module.id}><CardContent className="grid gap-5 pt-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:pt-6"><span className="grid size-11 place-items-center rounded-full bg-primary/10 font-bold text-primary">{module.sequence}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{module.title}</h2>{module.sequence === 1 && <Badge>Free preview</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{module.description}</p><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-4" />{module.lessons.length} lessons · quizzes and practice</p></div>{module.sequence > 1 && <LockKeyhole className="size-5 text-muted-foreground" aria-label="Full program" />}</CardContent></Card>)}</div></div>; }
