/* eslint-disable @typescript-eslint/no-require-imports -- Uses the existing TypeScript loader for local content tools. */
require("../content/register.cjs");
const fs = require("node:fs");
const {
  evaluateWritingCalibration,
} = require("../../src/lib/domain/calibration.ts");

try {
  const file = process.argv[2];
  if (!file)
    throw new Error("Usage: npm run check:calibration -- <ratings.json>");
  const result = evaluateWritingCalibration(
    JSON.parse(fs.readFileSync(file, "utf8")),
  );
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.meetsTargets ? 0 : 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
