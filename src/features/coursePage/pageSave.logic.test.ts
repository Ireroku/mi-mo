// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { buildPageDownloads, type PageSource } from "./pageSave.logic";

const source: PageSource = {
  name: "第1回: 講義資料",
  url: "https://example.test/mod/page/view.php?id=10",
};

const FILE_BASE = "https://example.test/pluginfile.php/99/mod_page/content/3";

function parse(body: string): Document {
  return new DOMParser().parseFromString(
    `<html><body><div id="region-main"><div class="box generalbox"><div class="no-overflow">${body}</div></div></div></body></html>`,
    "text/html",
  );
}

function markdownOf(url: string): string {
  return decodeURIComponent(url.slice(url.indexOf(",") + 1));
}

describe("buildPageDownloads", () => {
  it("本文が無い文書では空の配列を返す", () => {
    const doc = new DOMParser().parseFromString("<p>ログイン</p>", "text/html");
    expect(buildPageDownloads(doc, source)).toEqual([]);
  });

  it("画像を出現順の連番で保存し、Markdown から相対パスで指す", () => {
    const doc = parse(
      `<p><img src="${FILE_BASE}/slide%20b.PNG"></p><p><img src="${FILE_BASE}/slide%20a.PNG"></p>`,
    );
    const [markdown, ...files] = buildPageDownloads(doc, source);

    expect(markdown?.filename).toBe("第1回- 講義資料/第1回- 講義資料.md");
    expect(files).toEqual([
      { url: `${FILE_BASE}/slide%20b.PNG`, filename: "第1回- 講義資料/001.PNG" },
      { url: `${FILE_BASE}/slide%20a.PNG`, filename: "第1回- 講義資料/002.PNG" },
    ]);

    const text = markdownOf(markdown!.url);
    expect(text.startsWith(`# ${source.name}\n\n${source.url}\n\n`)).toBe(true);
    expect(text).toContain("![](001.PNG)");
    expect(text).toContain("![](002.PNG)");
  });

  it("同じ画像を2回使っている場合は、1件だけ保存する", () => {
    const img = `<img src="${FILE_BASE}/a.png">`;
    const [, ...files] = buildPageDownloads(parse(`<p>${img}</p><p>${img}</p>`), source);
    expect(files).toHaveLength(1);
  });

  it("画像以外の添付は元のファイル名で保存する", () => {
    const doc = parse(`<p><a href="${FILE_BASE}/%E8%B3%87%E6%96%99.pdf">資料</a></p>`);
    const [markdown, ...files] = buildPageDownloads(doc, source);
    expect(files).toEqual([
      { url: `${FILE_BASE}/%E8%B3%87%E6%96%99.pdf`, filename: "第1回- 講義資料/資料.pdf" },
    ]);
    expect(markdownOf(markdown!.url)).toContain(`[資料](${encodeURI("資料.pdf")})`);
  });

  it("音声をファイルへのリンクにする", () => {
    const doc = parse(`<audio controls><source src="${FILE_BASE}/voice.mp3">再生できません</audio>`);
    const [markdown, ...files] = buildPageDownloads(doc, source);
    expect(files.map((file) => file.filename)).toEqual(["第1回- 講義資料/voice.mp3"]);
    expect(markdownOf(markdown!.url)).toContain("[voice.mp3](voice.mp3)");
  });

  it("本文の外を指すリンクは保存せず、絶対URLにする", () => {
    const doc = parse(`<p><a href="/mod/page/view.php?id=11">次のページ</a></p>`);
    const [markdown, ...files] = buildPageDownloads(doc, source);
    expect(files).toEqual([]);
    expect(markdownOf(markdown!.url)).toContain(
      "[次のページ](https://example.test/mod/page/view.php?id=11)",
    );
  });
});
