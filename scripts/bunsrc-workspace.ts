#!/usr/bin/env bun

import { $ } from "bun";
import { findWorkspaces } from "./lib/util";

async function updateExports(
  workspacePath: string,
  findReplace: Record<string, string>
): Promise<null> {
  const exports = (await $`bun --cwd=${workspacePath} pm pkg get exports`.quiet()).text();
  if (exports != "{}") {
    var newExports = exports;
    for (const [find, replace] of Object.entries(findReplace)) {
      newExports = newExports.replaceAll(find, replace);
    }
    if (newExports != exports) {
      console.log(`Updating exports for ${workspacePath}`);
      await $`bun --cwd=${workspacePath} pm pkg set exports=${newExports} --json`;
    }
  }
  return null;
}

const bunUseSource = {
  [`"bun": "./dist/bun.js"`]: `"bun": "./src/bun.ts"`,
  [`"bun": "./dist/index.js"`]: `"bun": "./src/index.ts"`,
  [`"import": "./dist/bun.js"`]: `"import": "./src/bun.ts"`,
  [`"types": "./dist/types.d.ts"`]: `"types": "./src/types.ts"`,
  [`"types": "./dist/bun.d.ts"`]: `"types": "./src/bun.ts"`,
};
const bunUseDist = {
  [`"bun": "./src/bun.ts"`]: `"bun": "./dist/bun.js"`,
  [`"bun": "./src/index.ts"`]: `"bun": "./dist/index.js"`,
  [`"import": "./src/bun.ts"`]: `"import": "./dist/bun.js"`,
  [`"types": "./src/types.ts"`]: `"types": "./dist/types.d.ts"`,
  [`"types": "./src/bun.ts"`]: `"types": "./dist/bun.d.ts"`,
};

async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Usage: bun run bunsrc-workspace.ts <source|dist>");
    console.error("  source: Use source files (./src/*.ts)");
    console.error("  dist:   Use built files (./dist/*.js)");
    process.exit(1);
  }

  const mode = args[0];
  if (mode !== "source" && mode !== "dist") {
    console.error("Error: Mode must be either 'source' or 'dist'");
    console.error("Usage: bun run bunsrc-workspace.ts <source|dist>");
    process.exit(1);
  }

  const findReplace = mode === "source" ? bunUseSource : bunUseDist;
  console.log(`Using ${mode} exports`);

  const workspaces = await findWorkspaces();
  console.log(`Found ${workspaces.length} workspaces`);

  for (const workspace of workspaces) {
    const error = await updateExports(workspace, findReplace);
  }

  console.log(`\nChanging exports to ${mode} mode completed successfully`);
}

main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
