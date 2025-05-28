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

interface PublishError {
  workspace: string;
  error: string;
  isVersionConflict: boolean;
  output?: string;
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
      process.exit(1);
    }
  }

  return workspaces;
}

async function checkAndPublishWorkspace(workspacePath: string): Promise<PublishError | null> {
  try {
    const packageJsonPath = join(workspacePath, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8")) as PackageJson;

    if (packageJson.publishConfig?.access) {
      const access = packageJson.publishConfig.access;
      const output = execSync(`bun publish --access ${access}`, {
        cwd: workspacePath,
        stdio: "pipe",
      }).toString();

      // Check if the output contains an error message
      if (output.includes("You cannot publish over the previously published versions")) {
        return {
          workspace: workspacePath,
          error: "Version already published",
          isVersionConflict: true,
          output,
        };
      }

      // Check for other error messages in the output
      if (output.toLowerCase().includes("error") || output.toLowerCase().includes("failed")) {
        return {
          workspace: workspacePath,
          error: "Publish failed",
          isVersionConflict: false,
          output,
        };
      }
    }
    return null;
  } catch (error) {
    // This would only catch if the command itself fails to execute
    return {
      workspace: workspacePath,
      error: error instanceof Error ? error.message : String(error),
      isVersionConflict: false,
    };
  }
}

async function main(): Promise<void> {
  console.log("Starting workspace publishing process...");
  const workspaces = await findWorkspaces();
  console.log(`Found ${workspaces.length} workspaces`);

  const errors: PublishError[] = [];

  for (const workspace of workspaces) {
    const error = await checkAndPublishWorkspace(workspace);
    if (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    const versionConflicts = errors.filter((e) => e.isVersionConflict);
    const otherErrors = errors.filter((e) => !e.isVersionConflict);

    if (versionConflicts.length > 0) {
      console.log("\nVersion conflicts (not considered failures):");
      for (const error of versionConflicts) {
        console.log(`\n${error.workspace}:`);
        console.log(error.error);
      }
    }

    if (otherErrors.length > 0) {
      console.error("\nPublishing failed for the following workspaces:");
      for (const error of otherErrors) {
        console.error(`\n${error.workspace}:`);
        console.error(error.error);
        if (error.output) {
          console.error("\nCommand output:");
          console.error(error.output);
        }
      }
      process.exit(1);
    }
  }

  console.log("\nWorkspace publishing process completed successfully");
}

main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
