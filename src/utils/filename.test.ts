import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "./filename";

describe("sanitizeFilename", () => {
  it("ファイル名に使えない文字を - へ置き換える", () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe("a-b-c-d-e-f-g-h-i-j");
  });

  it("前後の空白を落とし、全角の文字は残す", () => {
    expect(sanitizeFilename("  課題（２０点） ")).toBe("課題（２０点）");
  });
});
