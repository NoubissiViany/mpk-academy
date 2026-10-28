import {
  diagnosticWritingVersion,
  type DiagnosticWritingSample,
} from "@/lib/domain/diagnostic-writing";

export const writingSampleFixture: DiagnosticWritingSample = {
  version: diagnosticWritingVersion,
  text: Array.from(
    { length: 10 },
    () => "Samedi nous avons participé ensemble à une activité intéressante.",
  ).join(" "),
};
