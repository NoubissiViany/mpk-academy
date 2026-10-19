/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Execute the authored TypeScript with the repository's installed compiler; no extra runtime dependency.
const ts = require("typescript");
const fs = require("node:fs");
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
};
