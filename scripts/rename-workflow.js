#!/usr/bin/env node

/**
 * This script helps migrate from CreateWorkflow to Workflow
 * It updates imports and type declarations in task files
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Find all files that contain CreateWorkflow
const findFiles = () => {
  const output = execSync(
    'grep -l "CreateWorkflow" $(find packages -name "*.ts" | grep -v "node_modules")'
  )
    .toString()
    .trim();

  return output.split("\n").filter(Boolean);
};

// Update a file to use Workflow instead of CreateWorkflow
const updateFile = (filePath) => {
  console.log(`Updating ${filePath}...`);

  let content = fs.readFileSync(filePath, "utf8");

  // Replace import statements
  content = content.replace(
    /import\s*{([^}]*)CreateWorkflow([^}]*?)}\s*from\s*["']@ellmers\/task-graph["']/g,
    'import {$1Workflow$2} from "@ellmers/task-graph"'
  );

  // Replace type declarations
  content = content.replace(/(\w+)\s*:\s*CreateWorkflow<([^>]+)>/g, "$1: Workflow<$2>");

  // Replace function calls
  content = content.replace(/CreateWorkflow\(([^)]+)\)/g, "Workflow($1)");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Updated ${filePath}`);
};

// Main function
const main = () => {
  console.log("Starting migration from CreateWorkflow to Workflow...");

  try {
    const files = findFiles();
    console.log(`Found ${files.length} files to update.`);

    files.forEach(updateFile);

    console.log("\nMigration complete! 🎉");
    console.log("Please review the changes and make any necessary adjustments.");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

main();
