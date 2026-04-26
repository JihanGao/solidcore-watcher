import { solidcoreConfig } from "./config";
import { readJsonFile, writeJsonFile } from "./fs";

type SolidcoreState = {
  lastAuthAlertAt?: string;
  lastCheckAt?: string;
  lastNotifiedTargetMonth?: string;
  lastResult?: {
    candidateLines: string[];
    matchedDays: number[];
    releaseDetected: boolean;
    selectedStudios?: string[];
    sessionInvalid?: boolean;
    targetMonth: string;
  };
};

type NotificationState = {
  lastNotifiedTargetMonth?: string;
};

export async function readSolidcoreState(): Promise<SolidcoreState> {
  return (await readJsonFile<SolidcoreState>(solidcoreConfig.stateFilePath)) ?? {};
}

export async function writeSolidcoreState(state: SolidcoreState): Promise<void> {
  await writeJsonFile(solidcoreConfig.stateFilePath, state);
}

export async function readNotificationState(): Promise<NotificationState> {
  return (await readJsonFile<NotificationState>(solidcoreConfig.notificationStatePath)) ?? {};
}

export async function writeNotificationState(state: NotificationState): Promise<void> {
  await writeJsonFile(solidcoreConfig.notificationStatePath, state);
}
