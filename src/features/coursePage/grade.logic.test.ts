// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { parseGradeReport } from "./grade.logic";

interface Row {
  href?: string;
  grade?: string;
  range?: string;
  percentage?: string;
  feedback?: string;
}

// 評定表の1行を、実機と同じクラス名で組み立てる
function row({ href, grade = "", range = "", percentage = "", feedback = "" }: Row): string {
  const name = href ? `<a href="${href}">項目</a>` : "項目";
  return `<tr>
    <th class="level2 item b1b column-itemname cell c0">${name}</th>
    <td class="level2 item b1b itemcenter column-weight cell c1">-</td>
    <td class="level2 item b1b itemcenter column-grade cell c2">${grade}</td>
    <td class="level2 item b1b itemcenter column-range cell c3">${range}</td>
    <td class="level2 item b1b itemcenter column-percentage cell c4">${percentage}</td>
    <td class="level2 item b1b feedbacktext column-feedback cell c5">${feedback}</td>
  </tr>`;
}

function report(...rows: string[]): string {
  return `<html><body><table class="generaltable user-grade"><tbody>${rows.join("")}</tbody></table></body></html>`;
}

const BASE = "https://example.test/mod";

describe("parseGradeReport", () => {
  it("活動へのリンクを持つ行から、cmid と各列の値を読む", () => {
    const html = report(
      row({
        href: `${BASE}/assign/view.php?id=101`,
        grade: "13.00",
        range: "0–26",
        percentage: "50.00 %",
        feedback: "よくできました",
      }),
    );
    expect(parseGradeReport(html)).toEqual([
      {
        cmid: "101",
        grade: "13.00",
        range: "0–26",
        percentage: "50.00 %",
        feedback: "よくできました",
      },
    ]);
  });

  it("評点が未入力（-）でもフィードバックがあれば残す", () => {
    const html = report(
      row({ href: `${BASE}/assign/view.php?id=102`, grade: "-", range: "0–10", percentage: "-", feedback: "再提出" }),
    );
    const [entry] = parseGradeReport(html);
    expect(entry?.cmid).toBe("102");
    expect(entry?.grade).toBeFalsy();
    expect(entry?.percentage).toBeUndefined();
    expect(entry?.feedback).toBe("再提出");
  });

  it("評点とフィードバックが両方とも空の行は除く", () => {
    const html = report(
      row({ href: `${BASE}/quiz/view.php?id=103`, grade: "-", range: "0–10" }),
      row({ href: `${BASE}/quiz/view.php?id=104`, grade: "8.00", range: "0–10" }),
    );
    expect(parseGradeReport(html).map((entry) => entry.cmid)).toEqual(["104"]);
  });

  it("活動へのリンクが無い行（合計など）は除く", () => {
    const html = report(
      row({ grade: "21.00", range: "0–36" }),
      row({ href: "https://example.test/grade/report/user/index.php?id=5", grade: "21.00" }),
    );
    expect(parseGradeReport(html)).toEqual([]);
  });

  it("評定表が無い文書では空にする", () => {
    expect(parseGradeReport("<html><body><p>ログイン</p></body></html>")).toEqual([]);
  });
});
