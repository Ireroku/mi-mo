import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "./filename";

describe("sanitizeFilename", () => {
  it("ファイル名に使えない文字を - へ置き換える", () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe("a-b-c-d-e-f-g-h-i-j");
  });

  it("前後の空白を落とし、全角の文字は残す", () => {
    expect(sanitizeFilename("  課題（２０点） ")).toBe("課題（２０点）");
  });

  it("階層をさかのぼる名前と Windows の予約名を避ける", () => {
    expect(sanitizeFilename("../a.md")).toBe("-a.md");
    expect(sanitizeFilename("..")).toBe("-");
    expect(sanitizeFilename("CON")).not.toBe("CON");
  });

  it("長い名前は拡張子を残して 200 文字に切る", () => {
    const result = sanitizeFilename(`${"あ".repeat(300)}.md`);
    expect(result).toHaveLength(200);
    expect(result.endsWith(".md")).toBe(true);
  });
});
