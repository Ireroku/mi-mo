import { describe, expect, it } from "vitest";
import {
  defaultPeriodName,
  findCurrentPeriod,
  findPeriodSegment,
  migratePeriodsFromV1,
  nextPeriodNumber,
  normalizePeriods,
  periodName,
  sortPeriodsByStart,
  type PeriodSlot,
} from "./periods";

const periods: PeriodSlot[] = [
  { period: 1, start: "08:50", end: "10:20" },
  { period: 2, start: "10:30", end: "12:00" },
];

describe("defaultPeriodName", () => {
  it("1〜10 は漢数字、それ以外は算用数字にする", () => {
    expect(defaultPeriodName(1)).toBe("一限");
    expect(defaultPeriodName(10)).toBe("十限");
    expect(defaultPeriodName(11)).toBe("11限");
  });
});

describe("periodName", () => {
  it("名前があればそれを、無いか空白だけなら既定の名前を返す", () => {
    expect(periodName({ period: 1, name: "1-2限", start: "", end: "" })).toBe("1-2限");
    expect(periodName({ period: 2, name: "  ", start: "", end: "" })).toBe("二限");
    expect(periodName({ period: 3, start: "", end: "" })).toBe("三限");
  });
});

describe("nextPeriodNumber", () => {
  it("並び順によらず、最大の番号の次を返す", () => {
    expect(nextPeriodNumber([...periods].reverse())).toBe(3);
    expect(nextPeriodNumber([])).toBe(1);
  });

  it("時間割に授業の残る番号も避ける", () => {
    expect(nextPeriodNumber(periods, [5])).toBe(6);
    expect(nextPeriodNumber(periods, [1])).toBe(3);
  });
});

describe("migratePeriodsFromV1", () => {
  const slot = (period: number, start = "") => ({ period, start, end: "" });

  it("番号の昇順に並べ、重なった番号は先に出たものだけを残す", () => {
    const old = [slot(3), slot(1, "a"), slot(2), slot(1, "b")];
    expect(migratePeriodsFromV1(old)).toEqual([slot(1, "a"), slot(2), slot(3)]);
  });

  it("正の整数でない番号を落とす", () => {
    expect(migratePeriodsFromV1([slot(0), slot(-1), slot(1.5), slot(2)])).toEqual([slot(2)]);
  });
});

describe("normalizePeriods", () => {
  const slot = (period: number, start = "") => ({ period, start, end: "" });

  it("番号が正しく重ならない表は、並びを変えずに返す", () => {
    const current = [slot(3), slot(1), slot(2)];
    expect(normalizePeriods(current)).toEqual(current);
  });

  it("番号が重なる表は、版 1 の表として直す", () => {
    const old = [slot(2), slot(1, "a"), slot(1, "b")];
    expect(normalizePeriods(old)).toEqual([slot(1, "a"), slot(2)]);
  });

  it("正の整数でない番号を含む表も、版 1 の表として直す", () => {
    expect(normalizePeriods([slot(2), slot(0)])).toEqual([slot(2)]);
  });
});

describe("sortPeriodsByStart", () => {
  it("開始時刻の昇順に並べ、元の配列を書き換えない", () => {
    const reversed = [...periods].reverse();
    expect(sortPeriodsByStart(reversed).map((p) => p.period)).toEqual([1, 2]);
    expect(reversed.map((p) => p.period)).toEqual([2, 1]);
  });

  it("時刻の空いた枠を除く", () => {
    const withEmpty = [{ period: 3, start: "", end: "" }, ...periods, { period: 4, start: "08:00", end: "" }];
    expect(sortPeriodsByStart(withEmpty).map((p) => p.period)).toEqual([1, 2]);
  });
});

describe("findCurrentPeriod", () => {
  it("開始時刻を含み、終了時刻を含まない", () => {
    expect(findCurrentPeriod(new Date(2026, 3, 10, 8, 50), periods)?.period).toBe(1);
    expect(findCurrentPeriod(new Date(2026, 3, 10, 10, 20), periods)).toBeUndefined();
  });
});

describe("findPeriodSegment", () => {
  const at = (h: number, m: number) => new Date(2026, 3, 10, h, m, 30);

  it("時限の最中は、その時限の終了を指す", () => {
    expect(findPeriodSegment(at(9, 0), periods)).toEqual({
      phase: "during",
      slot: periods[0],
      at: new Date(2026, 3, 10, 10, 20),
    });
  });

  it("休み時間は、次の時限の開始を指す", () => {
    expect(findPeriodSegment(at(10, 25), periods)).toEqual({
      phase: "before",
      slot: periods[1],
      at: new Date(2026, 3, 10, 10, 30),
    });
  });

  it("最初の時限の前は、最初の時限の開始を指す", () => {
    expect(findPeriodSegment(at(7, 0), periods)?.slot).toBe(periods[0]);
    expect(findPeriodSegment(at(7, 0), periods)?.phase).toBe("before");
  });

  it("開始ちょうどは最中、終了ちょうどは次の区切りに入る", () => {
    expect(findPeriodSegment(at(8, 50), periods)?.phase).toBe("during");
    expect(findPeriodSegment(at(10, 20), periods)).toMatchObject({
      phase: "before",
      slot: periods[1],
    });
    expect(findPeriodSegment(at(10, 30), periods)).toMatchObject({
      phase: "during",
      slot: periods[1],
    });
  });

  it("最後の時限の後と空の表では undefined を返し、翌日へ回さない", () => {
    expect(findPeriodSegment(at(12, 0), periods)).toBeUndefined();
    expect(findPeriodSegment(at(23, 0), periods)).toBeUndefined();
    expect(findPeriodSegment(at(9, 0), [])).toBeUndefined();
  });
});
