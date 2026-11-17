import { describe, expect, it } from "vitest";
import { formatDate, formatPeriodName, formatTime } from "./clock.logic";

// 2026年11月7日は土曜日
const morning = new Date(2026, 10, 7, 9, 5, 30);
const afternoon = new Date(2026, 10, 7, 14, 5, 30);
const midnight = new Date(2026, 10, 7, 0, 5, 30);

describe("formatTime", () => {
  it("24時間表記では時をゼロ埋めする", () => {
    expect(formatTime(morning, {})).toBe("09:05");
    expect(formatTime(afternoon, {})).toBe("14:05");
  });

  it("24時間表記の0時台を 00 と書く", () => {
    expect(formatTime(midnight, {})).toBe("00:05");
  });

  it("秒を足す", () => {
    expect(formatTime(morning, { showSeconds: true })).toBe("09:05:30");
  });

  it("12時間表記では午前・午後を付ける", () => {
    expect(formatTime(morning, { hour12: true })).toBe("午前9:05");
    expect(formatTime(afternoon, { hour12: true })).toBe("午後2:05");
    expect(formatTime(afternoon, { hour12: true, showSeconds: true })).toBe(
      "午後2:05:30",
    );
  });
});

describe("formatDate", () => {
  it("日付と曜日を並べる", () => {
    expect(formatDate(morning, { showDate: true, showWeekday: true })).toBe(
      "11/7 土",
    );
  });

  it("年を足す", () => {
    expect(
      formatDate(morning, { showDate: true, showWeekday: true, showYear: true }),
    ).toBe("2026/11/7 土");
  });

  it("片方だけを出す", () => {
    expect(formatDate(morning, { showDate: true })).toBe("11/7");
    expect(formatDate(morning, { showWeekday: true })).toBe("土");
  });

  it("年は日付と一緒にだけ出す", () => {
    expect(formatDate(morning, { showWeekday: true, showYear: true })).toBe("土");
  });

  it("どちらも出さない時は空文字を返す", () => {
    expect(formatDate(morning, {})).toBe("");
  });
});

describe("formatPeriodName", () => {
  it("2文字以内は1列にする", () => {
    expect(formatPeriodName("三限")).toBe("三限");
  });

  it("2文字ごとに列を分ける", () => {
    expect(formatPeriodName("11限")).toBe("11\n限");
    expect(formatPeriodName("昼休み")).toBe("昼休\nみ");
    expect(formatPeriodName("1234")).toBe("12\n34");
  });

  it("4文字を超えたら3文字と「…」にする", () => {
    expect(formatPeriodName("1-2限目")).toBe("1-\n2…");
  });
});
