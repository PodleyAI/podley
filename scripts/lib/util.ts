import { readFile, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { Glob } from "bun";

interface RootPackageJson {
  workspaces: string[];
}

export async function findWorkspaces(): Promise<string[]> {
  const workspaces: string[] = [];

  // Read root package.json
  const rootPackageJson = JSON.parse(
    (await readFile("./package.json", "utf-8")).toString()
  ) as RootPackageJson;

  // Process each workspace pattern
  for (const pattern of rootPackageJson.workspaces) {
    try {
      const globber = new Glob(pattern);
      for await (const match of globber.scan({ absolute: true, onlyFiles: false })) {
        try {
          const stats = await stat(match);
          if (stats.isDirectory()) {
            const packageJsonPath = join(match, "package.json");
            if (existsSync(packageJsonPath)) {
              workspaces.push(match);
            }
          }
        } catch (e) {
          // Ignore entries that cannot be stat'ed
          continue;
        }
      }
    } catch (error) {
      console.error(`Error processing workspace pattern ${pattern}:`, error);
      process.exit(1);
    }
  }

  return workspaces;
}
