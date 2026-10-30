// @vitest-environment node
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it("retains completed drafts after a provider failure and never overwrites a prior run or its reviews", () => {
  const root = process.cwd();
  const scratch = mkdtempSync(
    path.join(tmpdir(), "mpk-draft-checkpoint-test-"),
  );
  try {
    cpSync(path.join(root, "src"), path.join(scratch, "src"), {
      recursive: true,
    });
    mkdirSync(path.join(scratch, "scripts/content"), { recursive: true });
    for (const name of ["draft.cjs", "register.cjs", "server-only-stub.cjs"])
      cpSync(
        path.join(root, "scripts/content", name),
        path.join(scratch, "scripts/content", name),
      );
    symlinkSync(
      path.join(root, "node_modules"),
      path.join(scratch, "node_modules"),
      "dir",
    );
    const stub = path.join(scratch, "provider.cjs");
    writeFileSync(
      stub,
      `
const RealDate=Date;
global.Date=class extends RealDate { constructor(...args){super(...(args.length?args:['2026-10-29T12:00:00Z']))} static now(){return 1793275200000} };
global.setTimeout=(callback)=>{queueMicrotask(callback);return {unref(){}}};
let calls=0;
global.fetch=async()=>{
  if(++calls>1)return new Response('Synthetic provider failure',{status:400});
  const item={competency:'specific_detail',topic:'Synthetic test',documentType:'notice',document:'A synthetic document for a persistence test.',speakers:'',prompt:'Which detail?',correct:'A',wrong:['B','C','D'],explanation:'Synthetic English.',explanationFr:'Français synthétique.'};
  return Response.json({choices:[{message:{content:JSON.stringify({items:Array.from({length:5},()=>({...item}))})}}]});
};
`,
    );
    const run = () =>
      spawnSync(
        process.execPath,
        [
          "--require",
          stub,
          "scripts/content/draft.cjs",
          "new",
          "--exam",
          "TEF",
          "--skill",
          "reading",
          "--level",
          "B1",
          "--count",
          "6",
        ],
        {
          cwd: scratch,
          encoding: "utf8",
          timeout: 60_000,
          env: {
            ...process.env,
            GEMINI_API_KEY: "synthetic-test-key",
            GROQ_API_KEY: "",
          },
        },
      );
    const first = run();
    expect(first.status, first.stderr).toBe(1);
    expect(first.stderr, JSON.stringify(first)).toContain(
      "Synthetic provider failure",
    );
    const dir = path.join(scratch, "content/drafts");
    const name = readdirSync(dir)[0];
    const file = path.join(dir, name);
    const data = JSON.parse(readFileSync(file, "utf8"));
    expect(data.items).toHaveLength(5);
    expect(data.request).toMatchObject({
      count: 6,
      generatedCount: 5,
      generationComplete: false,
    });
    expect(
      data.items.every(
        (item: { review: string; teacher?: string }) =>
          item.review === "pending" && !item.teacher,
      ),
    ).toBe(true);
    data.items[0].review = "accepted";
    data.items[0].teacher = "approved";
    data.items[0].notes = "Synthetic owner decision: must be preserved.";
    writeFileSync(file, JSON.stringify(data));
    const saved = readFileSync(file, "utf8");
    const second = run();
    expect(second.status, second.stderr).toBe(1);
    expect(readdirSync(dir)).toHaveLength(2);
    expect(readFileSync(file, "utf8")).toBe(saved);
    const all = readdirSync(dir).flatMap(
      (entry) => JSON.parse(readFileSync(path.join(dir, entry), "utf8")).items,
    );
    expect(new Set(all.map((item: { id: string }) => item.id)).size).toBe(10);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}, 120_000);
