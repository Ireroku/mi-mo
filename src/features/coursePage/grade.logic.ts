// 評定ページの HTML から各活動の得点・範囲・パーセンテージ・フィードバックを抽出する。

import { readIdParam } from "@/utils/url";

export interface GradeEntry {
  cmid: string;
  grade: string;
  range?: string;
  percentage?: string;
  feedback?: string;
}

/**
 * 評定表の HTML をパースし、各活動の評定情報を返す。
 */
export function parseGradeReport(html: string): GradeEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rows = doc.querySelectorAll("table.user-grade tr");
  const entries: GradeEntry[] = [];
  for (const row of rows) {
    const itemLink = row.querySelector<HTMLAnchorElement>(
      'th.column-itemname a[href*="/mod/"]',
    );
    if (!itemLink) {
      continue;
    }

    const cmid = readIdParam(itemLink.href);
    if (!cmid) {
      continue;
    }

    const cleanText = (el: Element | null): string | undefined => {
      if (!el) {
        return undefined;
      }

      const t = (el.textContent || "").trim();
      return t === "" || t === "-" ? undefined : t;
    };

    const grade = cleanText(row.querySelector(".column-grade"));
    const range = cleanText(row.querySelector(".column-range"));
    const percentage = cleanText(row.querySelector(".column-percentage"));
    const feedback = cleanText(row.querySelector(".column-feedback"));
    // grade と feedback がどちらも空の行は結果へ含めない
    if (!grade && !feedback) {
      continue;
    }

    entries.push({
      cmid,
      grade: grade ?? "",
      range,
      percentage,
      feedback,
    });
  }

  return entries;
}
