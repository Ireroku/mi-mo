import { describe, expect, it } from "vitest";
import {
  COUNTDOWN_ENDED_LABEL,
  buildCountdownTargets,
  formatRemaining,
  resolvePeriodCountdown,
  wrapLabel,
} from "./countdownBadge.logic";
import type { PeriodSlot } from "@/utils/periods";
import type { LessonOccurrence } from "@/features/timetable/schedule.logic";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRemaining", () => {
  it("0以下は終了の文言にする", () => {
    expect(formatRemaining(0)).toBe(COUNTDOWN_ENDED_LABEL);
    expect(formatRemaining(-1)).toBe(COUNTDOWN_ENDED_LABEL);
  });

  it("15分以内は秒まで出す", () => {
    expect(formatRemaining(45 * SECOND)).toBe("45秒");
    expect(formatRemaining(15 * MINUTE)).toBe("15分0秒");
  });

  it("24時間以内は分まで出す", () => {
    expect(formatRemaining(15 * MINUTE + SECOND)).toBe("15分");
    expect(formatRemaining(DAY)).toBe("24時間0分");
  });

  it("7日以内は日と時間を出す", () => {
    expect(formatRemaining(DAY + HOUR)).toBe("1日と1時間");
    expect(formatRemaining(7 * DAY)).toBe("7日");
  });

  it("7日を超えたら日数だけを出す", () => {
    expect(formatRemaining(7 * DAY + HOUR)).toBe("7日");
    expect(formatRemaining(30 * DAY)).toBe("30日");
  });
});

describe("wrapLabel", () => {
  it("空白で改行する", () => {
    expect(wrapLabel("定期試験 開始まで")).toEqual(["定期試験", "開始まで"]);
    expect(wrapLabel("五限 終了まで")).toEqual(["五限", "終了まで"]);
  });

  it("空白が無ければ4文字ごとに折る", () => {
    expect(wrapLabel("試験まで")).toEqual(["試験まで"]);
    expect(wrapLabel("定期試験まで")).toEqual(["定期試験", "まで"]);
  });

  it("空白で分けた語も4文字ごとに折る", () => {
    expect(wrapLabel("前期試験 初日")).toEqual(["前期試験", "初日"]);
    expect(wrapLabel("前期定期 まで")).toEqual(["前期定期", "まで"]);
  });

  it("2行を超える分は捨て、2行目の末尾を「…」にする", () => {
    expect(wrapLabel("123456789")).toEqual(["1234", "567…"]);
    expect(wrapLabel("前期定期試験 開始まで")).toEqual(["前期定期", "試験…"]);
    expect(wrapLabel("a b c")).toEqual(["a", "b…"]);
  });

  it("書記素を途中で割らない", () => {
    // 結合文字（が = か + 濁点）と、ZWJ でつないだ絵文字を1文字として数える
    const family = "\u{1F468}‍\u{1F469}‍\u{1F467}";
    expect(wrapLabel(`が${family}12`)).toEqual([`が${family}12`]);
  });

  it("前後と連続の空白を除き、空なら行を返さない", () => {
    expect(wrapLabel("  試験  ")).toEqual(["試験"]);
    expect(wrapLabel("試験　 まで")).toEqual(["試験", "まで"]);
    expect(wrapLabel("")).toEqual([]);
  });
});

describe("resolvePeriodCountdown", () => {
  const periods: PeriodSlot[] = [
    { period: 1, start: "09:00", end: "10:30" },
    { period: 2, start: "10:40", end: "12:10" },
    { period: 5, start: "16:20", end: "17:50" },
  ];
  // 2026年11月17日は火曜日
  const at = (h: number, m: number) => new Date(2026, 10, 17, h, m, 0);

  it("時限の最中は、その時限の終了まで数える", () => {
    expect(resolvePeriodCountdown(at(17, 0), periods)).toEqual({
      kind: "counting",
      label: "五限 終了まで",
      target: at(17, 50),
    });
  });

  it("休み時間と最初の時限の前は、次の時限の開始まで数える", () => {
    expect(resolvePeriodCountdown(at(10, 35), periods)).toEqual({
      kind: "counting",
      label: "二限 まで",
      target: at(10, 40),
    });
    expect(resolvePeriodCountdown(at(7, 0), periods)).toMatchObject({ label: "一限 まで" });
  });

  it("開始ちょうどは最中、終了ちょうどは次の時限の前に入る", () => {
    expect(resolvePeriodCountdown(at(9, 0), periods)).toMatchObject({
      label: "一限 終了まで",
    });
    expect(resolvePeriodCountdown(at(10, 30), periods)).toMatchObject({
      label: "二限 まで",
    });
  });

  it("最後の時限の後は授業終了にする", () => {
    expect(resolvePeriodCountdown(at(17, 50), periods)).toEqual({ kind: "classesOver" });
  });

  describe("時間割に合わせる時", () => {
    const lesson = (date: Date, period: number): LessonOccurrence => ({
      date,
      weekday: "tue",
      periodIndex: period - 1,
      slot: { title: "授業" },
      count: 1,
    });
    const today = new Date(2026, 10, 17);
    const schedule = [
      lesson(today, 2),
      lesson(today, 5),
      lesson(new Date(2026, 10, 18), 1),
    ];

    it("授業のある時限だけを数え、空いた時限は飛ばす", () => {
      expect(resolvePeriodCountdown(at(9, 30), periods, schedule)).toMatchObject({
        label: "二限 まで",
        target: at(10, 40),
      });
      expect(resolvePeriodCountdown(at(12, 30), periods, schedule)).toMatchObject({
        label: "五限 まで",
        target: at(16, 20),
      });
      expect(resolvePeriodCountdown(at(11, 0), periods, schedule)).toMatchObject({
        label: "二限 終了まで",
      });
    });

    it("その日の最後の授業の後と、授業の無い日は授業終了にする", () => {
      expect(resolvePeriodCountdown(at(18, 0), periods, schedule)).toEqual({
        kind: "classesOver",
      });
      expect(
        resolvePeriodCountdown(new Date(2026, 10, 19, 9, 30), periods, schedule),
      ).toEqual({ kind: "classesOver" });
    });
  });
});

describe("buildCountdownTargets", () => {
  it("日時を指定した対象は、保存されたラベルとその日時を返す", () => {
    const [target] = buildCountdownTargets(
      [{ id: "a", label: "試験", source: { kind: "fixedDate", at: "2027-01-20T09:00" } }],
      [],
    );
    expect(target!.resolve(new Date())).toEqual({
      kind: "counting",
      label: "試験",
      target: new Date("2027-01-20T09:00"),
    });
  });

  it("日時が空の対象は飛ばす", () => {
    const targets = buildCountdownTargets(
      [{ id: "a", label: "", source: { kind: "fixedDate", at: "" } }],
      [],
    );
    expect(targets).toEqual([]);
  });
});
