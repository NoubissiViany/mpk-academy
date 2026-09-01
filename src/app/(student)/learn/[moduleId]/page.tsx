import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { courseModules } from "@/data/course";
export default async function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) { const { moduleId } = await params; const courseModule = courseModules.find((item) => item.id === moduleId); if (!courseModule) return <p>Module not found.</p>; return <><PageHeader eyebrow={`Module ${courseModule.sequence}`} title={courseModule.title} description={courseModule.description} /><div className="space-y-3">{courseModule.lessons.map((lesson) => <Card key={lesson.id}><CardContent className="flex items-center gap-4 pt-5 sm:pt-6"><span className="grid size-9 place-items-center rounded-full bg-learn/10 text-sm font-bold text-learn">{lesson.sequence}</span><div className="flex-1"><h2 className="font-bold">{lesson.title}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{lesson.duration} min</p></div>{lesson.isFree && <Badge>Free</Badge>}<Link href={`/learn/${courseModule.id}/${lesson.id}`} aria-label={`Open ${lesson.title}`} className="rounded-lg p-2 text-primary hover:bg-muted"><ChevronRight /></Link></CardContent></Card>)}</div></>; }
