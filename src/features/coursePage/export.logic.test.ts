import { describe, expect, it } from "vitest";
import { formatSection, type ExportedSection } from "./export.logic";

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
