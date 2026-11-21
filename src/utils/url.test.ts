import { describe, expect, it } from "vitest";
import { lastPathSegment, readIdParam } from "./url";

describe("readIdParam", () => {
  it("絶対 URL のクエリから id を読む", () => {
    expect(readIdParam("https://example.test/course/view.php?id=123")).toBe("123");
  });

  it("相対 URL のクエリから id を読む", () => {
    expect(readIdParam("/mod/page/view.php?id=45&forceview=1")).toBe("45");
  });

  it("id が無ければ null を返す", () => {
    expect(readIdParam("https://example.test/my/")).toBeNull();
  });

  it("URL として解けなければ null を返す", () => {
    expect(readIdParam("http://[")).toBeNull();
  });
});

describe("lastPathSegment", () => {
  it("パスの末尾をデコードして返す", () => {
    const url = new URL("https://example.test/pluginfile.php/1/mod_resource/content/2/%E8%B3%87%E6%96%99.pdf");
    expect(lastPathSegment(url)).toBe("資料.pdf");
  });

  it("末尾が区切りなら空文字を返す", () => {
    expect(lastPathSegment(new URL("https://example.test/dir/"))).toBe("");
  });

  it("デコードできない並びはそのまま返す", () => {
    expect(lastPathSegment(new URL("https://example.test/a/%E0%A4%A.txt"))).toBe("%E0%A4%A.txt");
  });
});
