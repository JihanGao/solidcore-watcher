import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const label = "com.solidcore.watcher";

async function main(): Promise<void> {
  const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${label}.plist`);
  await execFileAsync("launchctl", ["bootout", `gui/${process.getuid?.() ?? 501}`, plistPath]).catch(() => undefined);
  console.log(`Unloaded ${plistPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
