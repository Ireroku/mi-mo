import { describe, expect, it } from "vitest";
import {
  findCurrentPeriod,
  findNextPeriodStart,
  sortPeriodsByStart,
  type PeriodSlot,
} from "./periods";

const periods: PeriodSlot[] = [
  { period: 1, start: "08:50", end: "10:20" },
  { period: 2, start: "10:30", end: "12:00" },
];

describe("sortPeriodsByStart", () => {
  it("開始時刻の昇順に並べ、元の配列を書き換えない", () => {
    const reversed = [...periods].reverse();
    expect(sortPeriodsByStart(reversed).map((p) => p.period)).toEqual([1, 2]);
    expect(reversed.map((p) => p.period)).toEqual([2, 1]);
  });
});

describe("findCurrentPeriod", () => {
  it("開始時刻を含み、終了時刻を含まない", () => {
    expect(findCurrentPeriod(new Date(2026, 3, 10, 8, 50), periods)?.period).toBe(1);
    expect(findCurrentPeriod(new Date(2026, 3, 10, 10, 20), periods)).toBeUndefined();
  });
});

describe("findNextPeriodStart", () => {
  it("当日に残りがあれば、次の開始時刻を返す", () => {
    const next = findNextPeriodStart(new Date(2026, 3, 10, 9, 0), periods);
    expect(next).toEqual(new Date(2026, 3, 10, 10, 30));
  });

  it("当日に残りが無ければ、翌日の最初の時限へ回す", () => {
    const next = findNextPeriodStart(new Date(2026, 3, 10, 18, 0), periods);
    expect(next).toEqual(new Date(2026, 3, 11, 8, 50));
  });

  it("空の表では undefined を返す", () => {
    expect(findNextPeriodStart(new Date(2026, 3, 10), [])).toBeUndefined();
  });
});
