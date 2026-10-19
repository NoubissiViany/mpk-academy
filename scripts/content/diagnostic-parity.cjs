/* eslint-disable @typescript-eslint/no-require-imports -- Test runner uses the existing TypeScript compiler bootstrap. */
require("./register.cjs");
const Module = require("node:module");
const path = require("node:path");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(
    this,
    request.startsWith("@/")
      ? path.resolve(__dirname, "../../src", request.slice(2))
      : request,
    ...args,
  );
};
const {
  diagnosticItems,
} = require("../../src/content/diagnostic/questions.ts");
const { toQuestion } = require("../../src/content/adapters.ts");
const { scoreDiagnostic } = require("../../src/lib/domain/diagnostic.ts");
const quote = (value) =>
  "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
let sql = `begin;
insert into auth.users(id,email,raw_user_meta_data) values('50000000-0000-0000-0000-000000000005','parity@example.test','{"first_name":"Parity","last_name":"Test","exam":"TEF Canada"}');
set local request.jwt.claim.sub='50000000-0000-0000-0000-000000000005';
`;
const cases = [
  { name: "all-correct-pending", correct: () => true, ready: () => false },
  { name: "all-wrong-pending", correct: () => false, ready: () => false },
  { name: "alternating", correct: (_q, i) => i % 2 === 0, ready: () => false },
  {
    name: "grammar-priority",
    correct: (q) => q.diagnosticSkill !== "grammar",
    ready: () => false,
  },
  {
    name: "mixed-audio",
    correct: (_q, i) => i % 3 !== 0,
    ready: (_q, i) => i % 2 === 0,
  },
  {
    name: "all-audio-ready",
    correct: (_q, i) => i % 4 !== 0,
    ready: () => true,
  },
];
for (const [n, scenario] of cases.entries()) {
  const questions = diagnosticItems
    .map(toQuestion)
    .map((q, i) =>
      q.metadata?.audio && scenario.ready(q, i)
        ? {
            ...q,
            metadata: {
              ...q.metadata,
              audio: {
                ...q.metadata.audio,
                status: "ready",
                path: "/test-only/parity.wav",
              },
            },
          }
        : q,
    );
  const answers = Object.fromEntries(
    questions.map((q, i) => [
      q.id,
      scenario.correct(q, i)
        ? q.correctAnswer
        : q.options.find((o) => o.id !== q.correctAnswer).id,
    ]),
  );
  const expected = scoreDiagnostic(questions, answers);
  sql +=
    "update private.question_bank set audio_status='pending' where is_diagnostic and skill='listening';\n";
  for (const q of questions.filter(
    (q) => q.metadata?.audio?.status === "ready",
  ))
    sql += `update private.question_bank set audio_status='ready' where id='${q.id}';\n`;
  const rows = questions.map((q, sequence) => ({
    question_id: q.id,
    sequence,
    answer: answers[q.id],
  }));
  sql += `do $$ declare actual jsonb; begin
 actual:=public.mpk_submit_assessment('parity-${n}','diagnostic','TEF Canada','{}',${quote(rows)});
 if actual-'id' <> ${quote(expected)} then raise exception 'Diagnostic parity failed: ${scenario.name}: %',actual;end if;
 end $$;\n`;
}
sql +=
  "select 'Six guest/server diagnostic parity scenarios passed' as result;\nrollback;\n";
process.stdout.write(sql);
