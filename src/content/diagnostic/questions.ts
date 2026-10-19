import { items as reading } from "./reading";
import { items as listening } from "./listening";
import { items as grammar } from "./grammar";
import { items as vocabulary } from "./vocabulary";
export const diagnosticItems = [
  ...reading,
  ...listening,
  ...grammar,
  ...vocabulary,
].sort((a, b) => a.difficulty - b.difficulty);
export const diagnosticVersion = "mpk-diagnostic-v2";
