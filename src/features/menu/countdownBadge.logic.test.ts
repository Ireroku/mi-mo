import { describe, expect, it } from "vitest";
import { COUNTDOWN_ENDED_LABEL, formatRemaining } from "./countdownBadge.logic";

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
