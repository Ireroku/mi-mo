import { describe, expect, it } from "vitest";
import { chunkGraphemes, splitGraphemes, truncateGraphemes } from "./graphemes";

// 結合文字（が = か + 濁点）と、ZWJ でつないだ絵文字
const GA = "が";
const FAMILY = "\u{1F468}‍\u{1F469}‍\u{1F467}";

describe("splitGraphemes", () => {
  it("書記素を途中で割らない", () => {
    expect(splitGraphemes(`${GA}${FAMILY}a`)).toEqual([GA, FAMILY, "a"]);
  });
});

describe("chunkGraphemes", () => {
  it("指定の文字数ごとに区切る", () => {
    expect(chunkGraphemes("昼休み", 2)).toEqual(["昼休", "み"]);
    expect(chunkGraphemes("三限", 2)).toEqual(["三限"]);
    expect(chunkGraphemes(`${FAMILY}${GA}x`, 2)).toEqual([`${FAMILY}${GA}`, "x"]);
  });

  it("空文字では空の配列を返す", () => {
    expect(chunkGraphemes("", 2)).toEqual([]);
  });
});

describe("truncateGraphemes", () => {
  it("上限以内はそのまま返す", () => {
    expect(truncateGraphemes("1234", 4)).toBe("1234");
  });

  it("上限を超えたら末尾を「…」にして上限に収める", () => {
    expect(truncateGraphemes("12345", 4)).toBe("123…");
    expect(truncateGraphemes(`${FAMILY}${FAMILY}${FAMILY}${FAMILY}${FAMILY}`, 4)).toBe(
      `${FAMILY}${FAMILY}${FAMILY}…`,
    );
  });
});
