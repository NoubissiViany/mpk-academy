/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Execute the authored TypeScript with the repository's installed compiler; no extra runtime dependency.
const ts = require("typescript");
const fs = require("node:fs");
const Module = require("node:module");

// The content catalogs are marked server-only for Next.js. Scripts run in plain
// Node, where that guard would throw, so resolve it to an empty module.
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only")
    return require.resolve("./server-only-stub.cjs");
  return resolveFilename.call(this, request, ...rest);
};
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
};
