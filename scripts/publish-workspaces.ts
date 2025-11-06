#!/usr/bin/env bun

import { spawn } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { findWorkspaces } from "./lib/util";

interface PackageJson {
  name: string;
  version: string;
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

interface PublishSuccess {
  packageName: string;
  version: string;
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

async function checkAndPublishWorkspace(workspacePath: string): Promise<{
  error: PublishError | null;
  success: PublishSuccess | null;
}> {
  const packageJsonPath = join(workspacePath, "package.json");
  if (!existsSync(packageJsonPath)) {
    return {
      error: {
        packageName: packageJsonPath,
        error: "Not a valid package",
        isVersionConflict: false,
        output: "No package.json found",
      },
      success: null,
    };
  }
  const packageText = (await readFile(packageJsonPath, "utf-8")).toString();
  const packageJson = JSON.parse(packageText) as PackageJson;

  if (!packageJson.publishConfig?.access) {
    return { error: null, success: null };
  }

  const access = packageJson.publishConfig.access;
  let output: string;
  let error: any;

  try {
    console.log("Publishing", workspacePath);
    output = await runCommand(
      "bun",
      ["publish", "--access", access, "--no-color", "--tolerate-republish"],
      workspacePath
    );
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
      error: {
        packageName: packageJson.name,
        error: "Version already published",
        isVersionConflict: true,
        output,
      },
      success: null,
    };
  }

  if (error) {
    return {
      error: {
        packageName: packageJson.name,
        isVersionConflict: false,
        output,
        error,
      },
      success: null,
    };
  }

  return {
    error: null,
    success: {
      packageName: packageJson.name,
      version: packageJson.version,
    },
  };
}

async function createGitTag(packageName: string, version: string): Promise<string | null> {
  const tag = `${packageName}@${version}`;
  try {
    console.log(`Creating git tag: ${tag}`);
    await runCommand("git", ["tag", tag], process.cwd());
    console.log(`Successfully created tag: ${tag}`);
    return tag;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // If tag already exists, log it but don't fail
    if (errorMsg.includes("already exists")) {
      console.log(`Tag ${tag} already exists, skipping...`);
      return null;
    } else {
      console.error(`Failed to create tag ${tag}:`, errorMsg);
      return null;
    }
  }
}

async function pushGitTags(tags: string[]): Promise<void> {
  if (tags.length === 0) {
    return;
  }

  console.log("Pushing git tags to remote...");

  for (const tag of tags) {
    try {
      await runCommand("git", ["push", "origin", tag], process.cwd());
      console.log(`Pushed tag: ${tag}`);
    } catch (err) {
      // Log error but don't fail - packages are already published
      console.error(
        `Warning: Failed to push tag ${tag}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  console.log("Finished pushing git tags");
}

async function main(): Promise<void> {
  console.log("Starting workspace publishing process...");
  const workspaces = await findWorkspaces();
  console.log(`Found ${workspaces.length} workspaces`);

  const errors: PublishError[] = [];
  const successes: PublishSuccess[] = [];

  for (const workspace of workspaces) {
    const result = await checkAndPublishWorkspace(workspace);
    if (result.error) {
      errors.push(result.error);
    }
    if (result.success) {
      successes.push(result.success);
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

  // Create git tags for successfully published packages
  if (successes.length > 0) {
    console.log(`\nCreating git tags for ${successes.length} successfully published package(s)...`);
    const createdTags: string[] = [];

    for (const success of successes) {
      const tag = await createGitTag(success.packageName, success.version);
      if (tag) {
        createdTags.push(tag);
      }
    }

    // Push newly created tags to remote
    if (createdTags.length > 0) {
      await pushGitTags(createdTags);
    }
  }

  console.log("\nWorkspace publishing process completed successfully");
}

main().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
