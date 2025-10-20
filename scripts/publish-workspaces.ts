#!/usr/bin/env bun

import { spawn } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { findWorkspaces } from "./lib/util";

interface PackageJson {
  name: string;
  publishConfig?: {
    access?: string;
  };
}

interface PublishError {
  packageName: string;
  error: any;
  isVersionConflict: boolean;
  output?: string;
}

async function runCommand(command: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      console.log(data.toString());
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      const output = stdout + stderr;
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(output));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function checkAndPublishWorkspace(workspacePath: string): Promise<PublishError | null> {
  const packageJsonPath = join(workspacePath, "package.json");
  if (!existsSync(packageJsonPath)) {
    return {
      packageName: packageJsonPath,
      error: "Not a valid package",
      isVersionConflict: false,
      output: "No package.json found",
    };
  }
  const packageText = (await readFile(packageJsonPath, "utf-8")).toString();
  const packageJson = JSON.parse(packageText) as PackageJson;

  if (!packageJson.publishConfig?.access) {
    return null;
  }

  const access = packageJson.publishConfig.access;
  let output: string;
  let error: any;

  try {
    console.log("Publishing", workspacePath);
    output = await runCommand("bun", ["publish", "--access", access, "--no-color"], workspacePath);
  } catch (err) {
    output = err instanceof Error ? err.message : String(err);
    error = err;
  }

  // Check if the output contains a version conflict error message
  const isVersionConflict = output.includes(
    "You cannot publish over the previously published versions"
  );

  if (isVersionConflict) {
    return {
      packageName: packageJson.name,
      error: "Version already published",
      isVersionConflict: true,
      output,
    };
  }

  if (error) {
    return {
      packageName: packageJson.name,
      isVersionConflict: false,
      output,
      error,
    };
  }

  return null;
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
        console.log(`\n${error.packageName}:`);
        console.log(error.error);
      }
    }

    if (otherErrors.length > 0) {
      console.error("\nPublishing failed for the following workspaces:");
      for (const error of otherErrors) {
        console.error(`\n${error.packageName}:`);
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
