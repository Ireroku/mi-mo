import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PeriodSlot } from "@/utils/periods";
import { buildIcs } from "./ics";
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
      mon: [{ title: "月1" }],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
    },
    holidays: [],
    substitutes: [],
    color: "white",
    ...overrides,
  };
}

// 折り返しを戻し、VEVENT ごとの行の配列にする
function eventsOf(ics: string): string[][] {
  const lines = ics.replace(/\r\n /g, "").split("\r\n");
  const events: string[][] = [];
  let current: string[] | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = [];
    } else if (line === "END:VEVENT" && current) {
      events.push(current);
      current = null;
    } else if (current) {
      current.push(line);
    }
  }
  return events;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-01T03:04:05Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("buildIcs", () => {
  it("コマを、日本時間を UTC に直した週次の繰り返しにする", () => {
    const ics = buildIcs(makeConfig(), periods);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(eventsOf(ics)).toEqual([
      [
        "UID:mon-1@mi-mo",
        "DTSTAMP:20260401T030405Z",
        "DTSTART:20260405T235000Z",
        "DTEND:20260406T012000Z",
        "RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260420T012000Z",
        "SUMMARY:月1",
      ],
    ]);
  });

  it("休講の日を EXDATE に入れ、終わりを後ろへ延ばす", () => {
    const [event] = eventsOf(
      buildIcs(makeConfig({ holidays: [{ date: "2026-04-13" }] }), periods),
    );
    expect(event).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260427T012000Z");
    expect(event).toContain("EXDATE:20260412T235000Z");
  });

  it("振替の日は、繰り返しとは別の単発の予定にする", () => {
    const events = eventsOf(
      buildIcs(makeConfig({ substitutes: [{ date: "2026-04-07", weekday: "mon" }] }), periods),
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260413T012000Z");
    expect(events[1]).toEqual([
      "UID:mon-1-20260407@mi-mo",
      "DTSTAMP:20260401T030405Z",
      "DTSTART:20260406T235000Z",
      "DTEND:20260407T012000Z",
      "SUMMARY:月1",
    ]);
  });

  it("件名の区切り文字をエスケープし、URL を出す", () => {
    const config = makeConfig({
      grid: {
        mon: [{ title: "A, B; C\\D", url: "https://example.test/course/view.php?id=1" }],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
      },
    });
    const [event] = eventsOf(buildIcs(config, periods));
    expect(event).toContain("SUMMARY:A\\, B\\; C\\\\D");
    expect(event).toContain("URL:https://example.test/course/view.php?id=1");
  });

  it("75バイトを超える行を折り返し、戻すと元の件名になる", () => {
    const title = "情報".repeat(40);
    const config = makeConfig({
      grid: { mon: [{ title }], tue: [], wed: [], thu: [], fri: [] },
    });
    const ics = buildIcs(config, periods);
    const encoder = new TextEncoder();
    for (const line of ics.split("\r\n")) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(eventsOf(ics)[0]).toContain(`SUMMARY:${title}`);
  });

  it("時限表に無い時限の授業は予定に出さない", () => {
    expect(eventsOf(buildIcs(makeConfig(), []))).toEqual([]);
  });

  it("授業の無い時間割では予定を出さない", () => {
    const config = makeConfig({
      grid: { mon: [], tue: [], wed: [], thu: [], fri: [] },
    });
    expect(eventsOf(buildIcs(config, periods))).toEqual([]);
  });
});
