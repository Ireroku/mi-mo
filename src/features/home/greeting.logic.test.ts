import { describe, expect, it } from "vitest";
import {
  FIXED_SALUTATION,
  formatMessages,
  parseMessages,
  pickMessage,
  pickSalutation,
} from "./greeting.logic";

function at(hour: number, minute = 0): Date {
  return new Date(2026, 10, 17, hour, minute);
}

describe("pickSalutation", () => {
  it("時間帯に合わせて言葉を変える", () => {
    expect(pickSalutation(at(4, 59), "time")).toBe("こんばんは");
    expect(pickSalutation(at(5), "time")).toBe("おはようございます");
    expect(pickSalutation(at(10, 59), "time")).toBe("おはようございます");
    expect(pickSalutation(at(11), "time")).toBe("こんにちは");
    expect(pickSalutation(at(17, 59), "time")).toBe("こんにちは");
    expect(pickSalutation(at(18), "time")).toBe("こんばんは");
    expect(pickSalutation(at(0), "time")).toBe("こんばんは");
  });

  it("固定の言葉は時刻によらない", () => {
    expect(pickSalutation(at(8), "fixed")).toBe(FIXED_SALUTATION);
    expect(pickSalutation(at(22), "fixed")).toBe(FIXED_SALUTATION);
  });

  it("なしの場合は空文字を返す", () => {
    expect(pickSalutation(at(8), "none")).toBe("");
  });

  it("mode が無い場合は時間帯に合わせる", () => {
    expect(pickSalutation(at(8), undefined)).toBe("おはようございます");
  });
});

describe("pickMessage", () => {
  it("候補が無ければ undefined を返す", () => {
    expect(pickMessage([], "")).toBeUndefined();
  });

  it("直前の1件を避ける", () => {
    expect(pickMessage(["a", "b"], "a", () => 0)).toBe("b");
    expect(pickMessage(["a", "b"], "a", () => 0.99)).toBe("b");
    expect(pickMessage(["a", "b", "c"], "b", () => 0.99)).toBe("c");
  });

  it("候補が直前の1件だけなら、それを返す", () => {
    expect(pickMessage(["a"], "a", () => 0)).toBe("a");
    expect(pickMessage(["a", "a"], "a", () => 0.5)).toBe("a");
  });

  it("直前の1件が候補に無ければ、全体から選ぶ", () => {
    expect(pickMessage(["a", "b"], "", () => 0)).toBe("a");
    expect(pickMessage(["a", "b"], "z", () => 0.99)).toBe("b");
  });
});

describe("parseMessages", () => {
  it("1行を1件として読み、空行と前後の空白を除く", () => {
    expect(parseMessages("  一つ目 \r\n\r\n二つ目\n\n")).toEqual([
      "一つ目",
      "二つ目",
    ]);
  });

  it("重複した行を1件にまとめる", () => {
    expect(parseMessages("a\nb\na\n")).toEqual(["a", "b"]);
  });

  it("中身が無ければ空の配列を返す", () => {
    expect(parseMessages("\n  \n")).toEqual([]);
  });
});

describe("formatMessages", () => {
  it("1件を1行で書き、読み戻すと元へ戻る", () => {
    const messages = ["一つ目", "二つ目"];

    expect(formatMessages(messages)).toBe("一つ目\n二つ目\n");
    expect(parseMessages(formatMessages(messages))).toEqual(messages);
  });
});
