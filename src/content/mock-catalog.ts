import {
  items as tefItems,
  manifest as tefManifest,
} from "./tef/mock-exams/mock-01";
import {
  items as tcfItems,
  manifest as tcfManifest,
} from "./tcf/mock-exams/mock-01";
export const mockItems = [...tefItems, ...tcfItems];
export const manifests = [tefManifest, tcfManifest];
export function mockReady(id: string) {
  const manifest = manifests.find((m) => m.id === id);
  return (
    !!manifest &&
    manifest.sections
      .flatMap((s) => s.itemIds)
      .every((id) => {
        const item = mockItems.find((i) => i.id === id);
        return (
          !!item &&
          (item.kind !== "mcq" ||
            item.skill !== "listening" ||
            item.audio?.status === "ready")
        );
      })
  );
}
