import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const label = "com.solidcore.watcher";

async function main(): Promise<void> {
  const { stdout } = await execFileAsync("launchctl", ["print", `gui/${process.getuid?.() ?? 501}/${label}`]);
  console.log(stdout);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
