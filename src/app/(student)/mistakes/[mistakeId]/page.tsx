import { MistakeDetail } from "@/features/mistakes/mistake-detail";

export default async function MistakeDetailPage({
  params,
}: {
  params: Promise<{ mistakeId: string }>;
}) {
  const { mistakeId } = await params;
  return <MistakeDetail mistakeId={mistakeId} />;
}
