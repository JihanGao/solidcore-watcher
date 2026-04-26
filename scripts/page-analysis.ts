import { type Page } from "playwright";

import { type TargetMonthInfo } from "./dates";

export type MatchResult = {
  candidateLines: string[];
  inspectedTargetMonthDays: Array<{
    available: boolean;
    buttonText: string;
    classTimesCount: number;
    day: number;
    headingMatched: boolean;
  }>;
  pageText: string;
  matchedDays: number[];
  targetMonth: TargetMonthInfo;
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectMonthRegexes(targetMonth: TargetMonthInfo): RegExp[] {
  const monthNumber = targetMonth.monthIndex + 1;
  const paddedMonth = String(monthNumber).padStart(2, "0");
  const year = targetMonth.year;
  const fullMonth = escapeRegex(targetMonth.monthNameLong);
  const shortMonth = escapeRegex(targetMonth.monthNameShort);

  return [
    new RegExp(`\\b${fullMonth}\\s+([0-3]?\\d)(?:,\\s*${year})?\\b`, "gi"),
    new RegExp(`\\b${shortMonth}\\.?\\s+([0-3]?\\d)(?:,\\s*${year})?\\b`, "gi"),
    new RegExp(`\\b([0-3]?\\d)\\s+${fullMonth}\\b`, "gi"),
    new RegExp(`\\b${monthNumber}/([0-3]?\\d)/(?:${year}|\\d{2})\\b`, "gi"),
    new RegExp(`\\b${paddedMonth}/([0-3]?\\d)/(?:${year}|\\d{2})\\b`, "gi"),
    new RegExp(`\\b${year}-${paddedMonth}-([0-3]\\d)\\b`, "gi"),
  ];
}

function collectMonthHints(targetMonth: TargetMonthInfo): RegExp {
  const monthNumber = targetMonth.monthIndex + 1;
  const paddedMonth = String(monthNumber).padStart(2, "0");

  return new RegExp(
    [targetMonth.monthNameLong, targetMonth.monthNameShort, `${targetMonth.year}-${paddedMonth}`, `${monthNumber}/`]
      .map(escapeRegex)
      .join("|"),
    "i",
  );
}

function extractMatchesFromText(text: string, targetMonth: TargetMonthInfo): number[] {
  const matches: number[] = [];
  for (const regex of collectMonthRegexes(targetMonth)) {
    for (const match of text.matchAll(regex)) {
      const day = Number(match[1]);
      if (Number.isInteger(day) && day >= 1 && day <= 31) matches.push(day);
    }
  }
  return unique(matches).sort((left, right) => left - right);
}

function extractClassTimes(text: string): string[] {
  return [...text.matchAll(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s?(?:AM|PM)\b/g)].map(
    (match) => match[0],
  );
}

function getWeekdayNames(targetMonth: TargetMonthInfo, day: number): { long: string; short: string } {
  const date = new Date(targetMonth.year, targetMonth.monthIndex, day);
  return {
    long: date.toLocaleString("en-US", { weekday: "long" }),
    short: date.toLocaleString("en-US", { weekday: "short" }),
  };
}

async function inspectTargetMonthDays(page: Page, targetMonth: TargetMonthInfo): Promise<MatchResult["inspectedTargetMonthDays"]> {
  const inspections: MatchResult["inspectedTargetMonthDays"] = [];

  for (let day = 1; day <= 7; day += 1) {
    const weekday = getWeekdayNames(targetMonth, day);
    const button = page
      .locator("button")
      .filter({ hasText: new RegExp(`^\\s*${weekday.short}\\s*${day}\\s*$`, "i") })
      .first();

    if ((await button.count()) === 0) continue;

    const buttonText = (await button.innerText()).replace(/\s+/g, " ").trim();
    await button.click();
    await page.waitForTimeout(1200);

    const inspectedText = await page.locator("body").innerText();
    const headingMatched = new RegExp(`\\b${weekday.long}\\s+${targetMonth.monthNameLong}\\s+${day}\\b`, "i").test(
      inspectedText,
    );
    const classTimesCount = extractClassTimes(inspectedText).length;

    inspections.push({
      available: headingMatched && classTimesCount > 0,
      buttonText,
      classTimesCount,
      day,
      headingMatched,
    });
  }

  return inspections;
}

export async function analyzeSchedulePage(page: Page, targetMonth: TargetMonthInfo): Promise<MatchResult> {
  await page.waitForTimeout(1500);

  const pageText = await page.locator("body").innerText();
  const normalizedLines = pageText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const monthHintRegex = collectMonthHints(targetMonth);
  const candidateLines = unique(normalizedLines.filter((line) => monthHintRegex.test(line))).slice(0, 30);
  const matchedDays = extractMatchesFromText(pageText, targetMonth);
  const inspectedTargetMonthDays = await inspectTargetMonthDays(page, targetMonth);

  return {
    candidateLines,
    inspectedTargetMonthDays,
    pageText,
    matchedDays,
    targetMonth,
  };
}
