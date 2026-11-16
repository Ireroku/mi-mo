import { describe, expect, it } from "vitest";
import type { PeriodSlot } from "@/utils/periods";
import { formatDateKey } from "./date";
import { buildSchedule, lessonsOn } from "./schedule.logic";
import type { TimetableConfig } from "./types";

const periods: PeriodSlot[] = [
  { period: 1, start: "08:50", end: "10:20" },
  { period: 2, start: "10:30", end: "12:00" },
];

// 2026-04-06 は月曜日
function makeConfig(overrides: Partial<TimetableConfig> = {}): TimetableConfig {
  return {
    enabled: true,
    startDate: "2026-04-06",
    lessonCount: 3,
    grid: {
      mon: [{ title: "月1" }, { title: "月2" }],
      tue: [],
      wed: [null, { title: "水2" }],
      thu: [],
      fri: [],
    },
    holidays: [],
    substitutes: [],
    color: "white",
    ...overrides,
  };
}

function datesOf(config: TimetableConfig, title: string): string[] {
  return buildSchedule(config, periods)
    .filter((occ) => occ.slot.title === title)
    .map((occ) => formatDateKey(occ.date));
}

describe("buildSchedule", () => {
  it("各コマを毎週、授業回数ぶん並べる", () => {
    const config = makeConfig();
    expect(datesOf(config, "月1")).toEqual(["2026-04-06", "2026-04-13", "2026-04-20"]);
    expect(datesOf(config, "水2")).toEqual(["2026-04-08", "2026-04-15", "2026-04-22"]);
  });

  it("回数を1から順に振る", () => {
    const counts = buildSchedule(makeConfig(), periods)
      .filter((occ) => occ.slot.title === "月1")
      .map((occ) => occ.count);
    expect(counts).toEqual([1, 2, 3]);
  });

  it("休講日を飛ばし、その分だけ後ろへ延ばす", () => {
    const config = makeConfig({ holidays: [{ date: "2026-04-13" }] });
    expect(datesOf(config, "月1")).toEqual(["2026-04-06", "2026-04-20", "2026-04-27"]);
  });

  it("振替の日には、振替元の曜日の授業を行う", () => {
    const config = makeConfig({
      substitutes: [{ date: "2026-04-07", weekday: "mon" }],
    });
    expect(datesOf(config, "月1")).toEqual(["2026-04-06", "2026-04-07", "2026-04-13"]);
  });

  it("休講と振替が同じ日に重なった場合は、休講にする", () => {
    const config = makeConfig({
      holidays: [{ date: "2026-04-07" }],
      substitutes: [{ date: "2026-04-07", weekday: "mon" }],
    });
    expect(datesOf(config, "月1")).toEqual(["2026-04-06", "2026-04-13", "2026-04-20"]);
  });

  it("開始日の形式が合わない場合は空にする", () => {
    expect(buildSchedule(makeConfig({ startDate: "2026/04/06" }), periods)).toEqual([]);
  });
});

describe("lessonsOn", () => {
  it("指定した日のコマを時限の順に返す", () => {
    const schedule = buildSchedule(makeConfig(), periods);
    const titles = lessonsOn(new Date(2026, 3, 6), schedule).map((occ) => occ.slot.title);
    expect(titles).toEqual(["月1", "月2"]);
  });

  it("授業の無い日は空にする", () => {
    const schedule = buildSchedule(makeConfig(), periods);
    expect(lessonsOn(new Date(2026, 3, 7), schedule)).toEqual([]);
  });
});
