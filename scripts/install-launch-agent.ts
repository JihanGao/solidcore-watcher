import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { solidcoreConfig } from "./config";
import { ensureDir } from "./fs";

const execFileAsync = promisify(execFile);
const label = "com.solidcore.watcher";

function intervals(): string {
  const lines: string[] = [];
  for (let hour = 0; hour <= 5; hour += 1) {
    for (let minute = 0; minute <= 55; minute += 5) {
      lines.push(`      <dict><key>Hour</key><integer>${hour}</integer><key>Minute</key><integer>${minute}</integer></dict>`);
    }
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const repoDir = process.cwd();
  const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath = path.join(launchAgentsDir, `${label}.plist`);
  const nodePath = process.execPath;
  const tsxLoaderPath = path.join(repoDir, "node_modules", "tsx", "dist", "loader.mjs");
  const checkScriptPath = path.join(repoDir, "scripts", "check.ts");

  await ensureDir(launchAgentsDir);
  await ensureDir(solidcoreConfig.logsDir);

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${label}</string>
    <key>ProgramArguments</key>
    <array>
      <string>${nodePath}</string>
      <string>--import</string>
      <string>${tsxLoaderPath}</string>
      <string>${checkScriptPath}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${repoDir}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(solidcoreConfig.logsDir, "launchd.stdout.log")}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(solidcoreConfig.logsDir, "launchd.stderr.log")}</string>
    <key>StartCalendarInterval</key>
    <array>
${intervals()}
    </array>
  </dict>
</plist>
`;

  await fs.writeFile(plistPath, plist, "utf8");
  await execFileAsync("launchctl", ["bootout", `gui/${process.getuid?.() ?? 501}`, plistPath]).catch(() => undefined);
  await execFileAsync("launchctl", ["bootstrap", `gui/${process.getuid?.() ?? 501}`, plistPath]);

  console.log(`Installed LaunchAgent at ${plistPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
