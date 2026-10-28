import { countWords } from "./writing-checks";

export const diagnosticWritingVersion = "mpk-diagnostic-writing-v1";
export const diagnosticWritingRange = { min: 80, max: 120 };
export const diagnosticWritingMinutes = 10;
export const diagnosticWritingPrompt =
  "Vous venez de participer à une activité dans votre quartier. Écrivez à un ami pour raconter ce que vous avez fait, expliquer ce qui vous a plu ou déplu, et lui proposer une prochaine activité en précisant pourquoi. Vous pouvez inventer les détails.";

export type DiagnosticWritingSample = {
  version: typeof diagnosticWritingVersion;
  text: string;
};

export function isDiagnosticWritingSample(
  value: unknown,
): value is DiagnosticWritingSample {
  if (!value || typeof value !== "object") return false;
  const sample = value as Partial<DiagnosticWritingSample>;
  return (
    sample.version === diagnosticWritingVersion &&
    typeof sample.text === "string" &&
    sample.text.length <= 4000 &&
    countWords(sample.text) >= diagnosticWritingRange.min &&
    countWords(sample.text) <= diagnosticWritingRange.max
  );
}
