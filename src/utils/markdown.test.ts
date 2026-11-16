// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { htmlToMarkdown, htmlToPlainText } from "./markdown";

function element(html: string): Element {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
}

const HTML = `<h4>注意</h4><p>一段落<br>改行</p><p><strong>重要</strong>: <a href="https://example.test/a">資料</a></p><ul><li>項目1</li><li>項目2</li></ul>`;

describe("htmlToMarkdown", () => {
  it("段落・改行・書式・リストを Markdown の記法にする", () => {
    expect(htmlToMarkdown(element(HTML))).toBe(
      [
        "#### 注意",
        "一段落  \n改行",
        "**重要**: [資料](https://example.test/a)",
        "-   項目1\n-   項目2",
      ].join("\n\n"),
    );
  });

  it("渡した要素を書き換えない", () => {
    const el = element(HTML);
    htmlToMarkdown(el);
    expect(el.innerHTML).toBe(HTML);
  });
});

describe("htmlToPlainText", () => {
  it("段落とリストの区切りを保ち、書式の記号を落とす", () => {
    expect(htmlToPlainText(element(HTML))).toBe(
      [
        "注意",
        "一段落\n改行",
        "重要: 資料 (https://example.test/a)",
        "-   項目1\n-   項目2",
      ].join("\n\n"),
    );
  });

  it("記号をエスケープしない", () => {
    expect(htmlToPlainText(element("<p>1. 点数 * 2 [必須]</p>"))).toBe("1. 点数 * 2 [必須]");
  });

  it("文字列が URL と同じリンクは、URL を繰り返さない", () => {
    expect(
      htmlToPlainText(element(`<a href="https://example.test/a">https://example.test/a</a>`)),
    ).toBe("https://example.test/a");
  });
});
