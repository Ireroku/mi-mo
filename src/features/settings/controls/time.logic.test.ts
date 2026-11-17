import { describe, expect, it } from "vitest";
import { normalizeTime } from "./time.logic";

describe("normalizeTime", () => {
  it("コロンの付いた形を2桁ずつに揃える", () => {
    expect(normalizeTime("9:30")).toBe("09:30");
    expect(normalizeTime("14:30")).toBe("14:30");
  });

  it("区切りの無い数字は、末尾の2桁を分として読む", () => {
    expect(normalizeTime("930")).toBe("09:30");
    expect(normalizeTime("0930")).toBe("09:30");
    expect(normalizeTime("1430")).toBe("14:30");
  });

  it("2桁までの数字は時として読む", () => {
    expect(normalizeTime("9")).toBe("09:00");
    expect(normalizeTime("14")).toBe("14:00");
  });

  it("全角の数字とコロン、前後の空白を受け付ける", () => {
    expect(normalizeTime(" ９：３０ ")).toBe("09:30");
  });

  it("時刻として読めないものは undefined を返す", () => {
    expect(normalizeTime("")).toBeUndefined();
    expect(normalizeTime("24:00")).toBeUndefined();
    expect(normalizeTime("960")).toBeUndefined();
    expect(normalizeTime("9:3")).toBeUndefined();
    expect(normalizeTime("12345")).toBeUndefined();
    expect(normalizeTime("abc")).toBeUndefined();
  });
});
