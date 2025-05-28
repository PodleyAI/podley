#!/usr/bin/env bun

import { readFile } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import { glob } from "glob";

interface PackageJson {
  name: string;
  publishConfig?: {
    access?: string;
  };
}

interface RootPackageJson {
  workspaces: string[];
}

async function findWorkspaces(): Promise<string[]> {
  const workspaces: string[] = [];

  // Read root package.json
  const rootPackageJson = JSON.parse(await readFile("./package.json", "utf-8")) as RootPackageJson;

  // Process each workspace pattern
  for (const pattern of rootPackageJson.workspaces) {
    try {
      const matches = await glob(pattern, { nodir: false, withFileTypes: true });
      // Filter for directories and get their paths
      const dirs = matches.filter((match) => match.isDirectory()).map((match) => match.fullpath());
      workspaces.push(...dirs);
    } catch (error) {
      console.error(`Error processing workspace pattern ${pattern}:`, error);
    }
  }

  return workspaces;
}

async function checkAndPublishWorkspace(workspacePath: string): Promise<void> {
  try {
    const packageJsonPath = join(workspacePath, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8")) as PackageJson;

    if (packageJson.publishConfig?.access) {
      const access = packageJson.publishConfig.access;
      console.log(`\nPublishing ${packageJson.name} with access: ${access}`);
      try {
        execSync(`bun publish --access ${access}`, {
          cwd: workspacePath,
          stdio: "inherit",
        });
        console.log(`Successfully published ${packageJson.name}`);
      } catch (error) {
        console.error(
          `Failed to publish ${packageJson.name}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  } catch (error) {
    console.error(
      `Error processing ${workspacePath}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function main(): Promise<void> {
  console.log("Starting workspace publishing process...");
  const workspaces = await findWorkspaces();
  console.log(`Found ${workspaces.length} workspaces`);

  for (const workspace of workspaces) {
    await checkAndPublishWorkspace(workspace);
  }

  console.log("\nWorkspace publishing process completed");
}

main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
