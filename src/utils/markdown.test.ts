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

  it("code の無い pre も、br を改行にしてエスケープせずにコードブロックにする", () => {
    expect(
      htmlToMarkdown(element("<pre>&gt;&gt; a=[2, 4]<br>a =<br>&nbsp;&nbsp; 2&nbsp;&nbsp; 4</pre>")),
    ).toBe("```\n>> a=[2, 4]\na =\n   2   4\n```");
  });

  it("コードの中に ``` があれば、それより長い囲みにする", () => {
    expect(htmlToMarkdown(element("<pre>```</pre>"))).toBe("````\n```\n````");
  });

  it("th の無い表は、1行目を見出しの行にした GFM の表にする", () => {
    const html =
      "<table><tbody><tr><td>目<br>Number</td><td>1</td><td>2</td></tr><tr><td>確率</td><td>1/6</td><td>a|b</td></tr></tbody></table>";
    expect(htmlToMarkdown(element(html))).toBe(
      ["| 目<br>Number | 1 | 2 |", "| --- | --- | --- |", "| 確率 | 1/6 | a\\|b |"].join("\n"),
    );
  });

  it("セルの数が少ない行は空のセルで埋め、見出しの列を最も多い行に合わせる", () => {
    const html = "<table><tr><td>a</td></tr><tr><td>b</td><td>c</td></tr></table>";
    expect(htmlToMarkdown(element(html))).toBe(
      ["| a | |", "| --- | --- |", "| b | c |"].join("\n"),
    );
  });

  it("セルを結合した表は HTML のまま残す", () => {
    const html = '<table><tbody><tr><td colspan="2">a</td></tr></tbody></table>';
    expect(htmlToMarkdown(element(html))).toBe(html);
  });

  it("MathJax の数式はエスケープせず、$ と $$ で囲む", () => {
    expect(
      htmlToMarkdown(element("<p>\\(f_x(x) * g\\) と \\[ a_1 \\] と $$b_2$$ で 100$</p>")),
    ).toBe("$f_x(x) * g$ と \n\n$$\na_1\n$$\n\n と \n\n$$\nb_2\n$$\n\n で 100\\$");
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
