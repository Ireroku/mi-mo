// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { formatSection, readSection, type ExportedSection } from "./export.logic";

const section: ExportedSection = {
  title: "課題",
  summary: "提出の注意",
  activities: [
    {
      name: "課題提出",
      kind: "assign",
      url: "https://example.test/mod/assign/view.php?id=1",
      dates: ["開始: 4月10日", "期限: 4月17日"],
    },
    { name: "", kind: "label", body: "ラベルの本文" },
    { name: "独自の活動", kind: "customkind" },
  ],
};

describe("formatSection", () => {
  it("Markdown では見出し・説明文・活動の順に並べる", () => {
    expect(formatSection(section, "markdown")).toBe(
      [
        "## 課題",
        "提出の注意",
        "- [課題提出](https://example.test/mod/assign/view.php?id=1) — 課題\n  - 開始: 4月10日\n  - 期限: 4月17日",
        "ラベルの本文",
        "- 独自の活動 — customkind",
      ].join("\n\n") + "\n",
    );
  });

  it("テキストでは同じ項目を記号なしで並べる", () => {
    const text = formatSection(section, "text");
    expect(text.startsWith("課題\n\n提出の注意\n\n課題提出（課題）\n")).toBe(true);
    expect(text).toContain("  https://example.test/mod/assign/view.php?id=1");
    expect(text).toContain("ラベルの本文");
  });

  it("説明文が無い場合は、見出しの直後に活動を置く", () => {
    const text = formatSection({ title: "資料", activities: [] }, "markdown");
    expect(text).toBe("## 資料\n");
  });
});

// コースページのセクションを、実機と同じクラス名で組み立てる
function parseSection(inner: string): Element {
  document.body.innerHTML = `<ul><li class="section course-section">
    <div class="course-section-header"><h3 class="sectionname">第1回</h3></div>
    <div class="content course-content-item-content">${inner}</div>
  </li></ul>`;
  return document.querySelector("li.section")!;
}

const RESOURCE = `<li class="activity activity-wrapper resource modtype_resource hasinfo">
  <div class="activity-item focus-control" data-activityname="講義資料" data-region="activity-card">
    <div class="activityname">
      <a href="https://example.test/mod/resource/view.php?id=11" class="aalink stretched-link">講義資料&nbsp;ファイル</a>
    </div>
  </div>
</li>`;

const ASSIGN = `<li class="activity activity-wrapper assign modtype_assign hasinfo">
  <div class="activity-item focus-control" data-activityname="レポート" data-region="activity-card">
    <div class="activityname">
      <a href="https://example.test/mod/assign/view.php?id=12" class="aalink stretched-link">レポート&nbsp;課題</a>
    </div>
    <div data-region="activity-dates" class="activity-dates me-sm-2">
      <div><strong>開始:</strong> 2026年 04月 10日(金曜日) 00:00</div>
      <div><strong>期限:</strong> 2026年 04月 17日(金曜日) 23:59</div>
    </div>
  </div>
</li>`;

const LABEL = `<li class="activity activity-wrapper label modtype_label hasinfo">
  <div class="activity-item focus-control activityinline" data-activityname=" " data-region="activity-card">
    <div class="activity-altcontent text-break">
      <div class="no-overflow"><div class="no-overflow">教科書を持参してください</div></div>
    </div>
  </div>
</li>`;

describe("readSection", () => {
  it("見出しと、活動の名前・種別・URL を読む", () => {
    const section = readSection(parseSection(`<ul>${RESOURCE}</ul>`), "markdown");
    expect(section).toEqual({
      title: "第1回",
      summary: undefined,
      activities: [
        {
          name: "講義資料",
          kind: "resource",
          url: "https://example.test/mod/resource/view.php?id=11",
          dates: undefined,
          body: undefined,
        },
      ],
    });
  });

  it("課題の開始と期限を、行ごとに読む", () => {
    const [assign] = readSection(parseSection(`<ul>${ASSIGN}</ul>`), "markdown").activities;
    expect(assign?.dates).toEqual([
      "開始: 2026年 04月 10日(金曜日) 00:00",
      "期限: 2026年 04月 17日(金曜日) 23:59",
    ]);
  });

  it("ラベルは本文を読み、URL を持たない", () => {
    const [label] = readSection(parseSection(`<ul>${LABEL}</ul>`), "markdown").activities;
    expect(label).toMatchObject({ kind: "label", body: "教科書を持参してください" });
    expect(label?.url).toBeUndefined();
  });

  it("説明文を読み、その中に紛れた活動の要素は数えない", () => {
    const section = readSection(
      parseSection(
        `<div class="my-3"><div class="summarytext">今回の範囲<ul><li class="activity">貼り付けられた行</li></ul></div></div>
        <ul>${RESOURCE}</ul>`,
      ),
      "markdown",
    );
    expect(section.summary).toContain("今回の範囲");
    expect(section.activities.map((act) => act.name)).toEqual(["講義資料"]);
  });

  it("説明文とラベルの段落・改行・リンクを、形式に合わせて残す", () => {
    const el = parseSection(
      `<div class="my-3"><div class="summarytext"><p>一段落<br>改行</p><p><a href="https://example.test/a">資料</a></p></div></div>`,
    );
    expect(readSection(el, "markdown").summary).toBe(
      "一段落  \n改行\n\n[資料](https://example.test/a)",
    );
    expect(readSection(el, "text").summary).toBe(
      "一段落\n改行\n\n資料 (https://example.test/a)",
    );
  });

  it("名前の属性が無い活動は、リンクの文字列を名前にする", () => {
    const html = RESOURCE.replace(' data-activityname="講義資料"', "");
    const [activity] = readSection(parseSection(`<ul>${html}</ul>`), "markdown").activities;
    expect(activity?.name).toBe("講義資料\u00a0ファイル");
  });

  it("見出しが無いセクションは「セクション」とする", () => {
    document.body.innerHTML = `<ul><li class="section"></li></ul>`;
    expect(readSection(document.querySelector("li.section")!, "markdown").title).toBe("セクション");
  });
});
