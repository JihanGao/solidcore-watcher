import fs from "node:fs/promises";

import { solidcoreConfig } from "./config";
import { readSolidcoreState, writeSolidcoreState } from "./state";

async function main(): Promise<void> {
  const state = await readSolidcoreState();

  if (state.lastNotifiedTargetMonth) {
    const nextState = { ...state };
    delete nextState.lastNotifiedTargetMonth;
    await writeSolidcoreState(nextState);
  }

  await fs.rm(solidcoreConfig.notificationStatePath, { force: true });

  console.log("Cleared solidcore release notification state.");
  console.log(`Local state file: ${solidcoreConfig.stateFilePath}`);
  console.log(`Shared notification lock: ${solidcoreConfig.notificationStatePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
