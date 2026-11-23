// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  buildAssignFiles,
  buildPageFiles,
  parseMoodleDate,
  readFileTypes,
  type PageSource,
} from "./pageSave.logic";

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

describe("buildPageFiles", () => {
  it("本文が無い文書では null を返す", () => {
    const doc = new DOMParser().parseFromString("<p>ログイン</p>", "text/html");
    expect(buildPageFiles(doc, source)).toBeNull();
  });

  it("data: URL の画像も連番のファイルに分け、Markdown に data: を残さない", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    const doc = parse(
      `<p><img src="${png}"><img src="data:image/jpeg;base64,/9j/4A=="><img src="${png}"></p>`,
    );
    const files = buildPageFiles(doc, source)!;

    expect(files.embedded).toEqual([
      { url: png, name: "001.png" },
      { url: "data:image/jpeg;base64,/9j/4A==", name: "002.jpg" },
    ]);
    expect(files.markdown).toContain("![](001.png)![](002.jpg)![](001.png)");
    expect(files.markdown).not.toContain("data:");
  });

  it("画像を出現順の連番で保存し、Markdown から相対パスで指す", () => {
    const doc = parse(
      `<p><img src="${FILE_BASE}/slide%20b.PNG"></p><p><img src="${FILE_BASE}/slide%20a.PNG"></p>`,
    );
    const files = buildPageFiles(doc, source)!;

    expect(files.folder).toBe("第1回- 講義資料");
    expect(files.embedded).toEqual([
      { url: `${FILE_BASE}/slide%20b.PNG`, name: "001.PNG" },
      { url: `${FILE_BASE}/slide%20a.PNG`, name: "002.PNG" },
    ]);
    expect(files.markdown.startsWith(`# ${source.name}\n\n${source.url}\n\n`)).toBe(true);
    expect(files.markdown).toContain("![](001.PNG)");
    expect(files.markdown).toContain("![](002.PNG)");
  });

  it("同じ画像を2回使っている場合は、1件だけ保存する", () => {
    const img = `<img src="${FILE_BASE}/a.png">`;
    const files = buildPageFiles(parse(`<p>${img}</p><p>${img}</p>`), source)!;
    expect(files.embedded).toHaveLength(1);
  });

  it("画像以外の添付は元のファイル名で保存する", () => {
    const doc = parse(`<p><a href="${FILE_BASE}/%E8%B3%87%E6%96%99.pdf">資料</a></p>`);
    const files = buildPageFiles(doc, source)!;
    expect(files.embedded).toEqual([
      { url: `${FILE_BASE}/%E8%B3%87%E6%96%99.pdf`, name: "資料.pdf" },
    ]);
    expect(files.markdown).toContain(`[資料](${encodeURI("資料.pdf")})`);
  });

  it("音声をファイルへのリンクにする", () => {
    const doc = parse(`<audio controls><source src="${FILE_BASE}/voice.mp3">再生できません</audio>`);
    const files = buildPageFiles(doc, source)!;
    expect(files.embedded.map((file) => file.name)).toEqual(["voice.mp3"]);
    expect(files.markdown).toContain("[voice.mp3](voice.mp3)");
  });

  it("本文の外を指すリンクは保存せず、絶対URLにする", () => {
    const doc = parse(`<p><a href="/mod/page/view.php?id=11">次のページ</a></p>`);
    const files = buildPageFiles(doc, source)!;
    expect(files.embedded).toEqual([]);
    expect(files.markdown).toContain(
      "[次のページ](https://example.test/mod/page/view.php?id=11)",
    );
  });
});

const assignSource: PageSource = {
  name: "第6回課題: レポート",
  url: "https://example.test/mod/assign/view.php?id=20",
};

function parseAssign(header: string): Document {
  return new DOMParser().parseFromString(
    `<html><body><div id="region-main"><div class="activity-header" data-for="page-activity-header">${header}</div></div></body></html>`,
    "text/html",
  );
}

const DATES = `<div class="activity-information"><div class="activity-dates"><div><strong>開始:</strong> 2026年 10月 3日(金曜日) 9:05 </div><div><strong>期限:</strong> 2026年 10月 26日(月曜日) 23:59 </div></div></div>`;

describe("parseMoodleDate", () => {
  it("Moodle の日時を ISO 8601 の形にする", () => {
    expect(parseMoodleDate(" 2026年 10月 3日(金曜日) 9:05 ")).toBe("2026-10-03T09:05");
  });

  it("読めない文字列では null を返す", () => {
    expect(parseMoodleDate("明日")).toBeNull();
  });
});

describe("readFileTypes", () => {
  it("提出できるファイルの拡張子を重複なく並べる", () => {
    const doc = new DOMParser().parseFromString(
      `<div class="form-filetypes-descriptions"><ul><li>PDF <small>.pdf</small></li><li>画像 <small>.png .jpg</small></li><li>PDF <small>.pdf</small></li></ul></div>`,
      "text/html",
    );
    expect(readFileTypes(doc)).toEqual([".pdf", ".png", ".jpg"]);
  });

  it("制限の無い提出画面では空の配列を返す", () => {
    expect(readFileTypes(new DOMParser().parseFromString("<form></form>", "text/html"))).toEqual([]);
  });
});

describe("buildAssignFiles", () => {
  it("課題の帯が無い文書では null を返す", () => {
    const doc = new DOMParser().parseFromString("<p>ログイン</p>", "text/html");
    expect(buildAssignFiles(doc, assignSource, [])).toBeNull();
  });

  it("名前・URL・日時・拡張子を Frontmatter に、説明文を本文に書く", () => {
    const doc = parseAssign(
      `${DATES}<div class="activity-description"><div class="no-overflow"><p>PDF で提出</p></div></div>`,
    );
    expect(buildAssignFiles(doc, assignSource, [".pdf", ".wav"])?.markdown).toBe(
      [
        "---",
        'title: "第6回課題: レポート"',
        'url: "https://example.test/mod/assign/view.php?id=20"',
        "start: 2026-10-03T09:05",
        "due: 2026-10-26T23:59",
        "file_types:",
        '  - ".pdf"',
        '  - ".wav"',
        "---",
        "",
        "PDF で提出",
        "",
      ].join("\n"),
    );
  });

  it("日時と説明文の無い課題は、名前と URL だけを書く", () => {
    const doc = parseAssign(`<div class="activity-information"></div>`);
    const files = buildAssignFiles(doc, assignSource, [])!;
    expect(files.markdown).toBe(
      '---\ntitle: "第6回課題: レポート"\nurl: "https://example.test/mod/assign/view.php?id=20"\n---\n\n',
    );
    expect(files.embedded).toEqual([]);
  });
});
