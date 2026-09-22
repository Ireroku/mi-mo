// 評定ページを非同期取得し、コースページの各活動の横へ評点とフィードバックを差し込む。

import { isCoursePage } from "@/moodle/page";
import { applyStyleSheet } from "@/utils/styleSheet";
import { parseGradeReport } from "./grade.logic";

export interface GradeInlineConfig {
  enabled: boolean;
}

const GRADE_INLINE_CSS = `
body.pagelayout-course .mimo-grade {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--primary, #0f6cbf);
}

body.pagelayout-course .mimo-grade-percentage {
  margin-left: 0.25rem;
  opacity: 0.8;
}

body.pagelayout-course .mimo-grade-feedback {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  opacity: 0.85;
}
`;

/**
 * コースページの評点インライン表示を初期化する。
 */
export async function initGradeInline(
  config: GradeInlineConfig,
): Promise<void> {
  if (!config.enabled || !isCoursePage()) return;

  const gradesLink = document.querySelector<HTMLAnchorElement>(
    '.secondary-navigation li[data-key="grades"] a',
  );
  if (!gradesLink || !gradesLink.href) return;

  let html: string;
  try {
    const res = await fetch(gradesLink.href, { credentials: "same-origin" });
    if (!res.ok) return;
    html = await res.text();
  } catch {
    return;
  }

  const entries = parseGradeReport(html);
  if (entries.length === 0) return;

  applyStyleSheet("mimo-course-page-grade-inline", GRADE_INLINE_CSS);

  for (const entry of entries) {
    const moduleEl = document.querySelector(`#module-${entry.cmid}`);
    if (!moduleEl) continue;

    const targetArea = moduleEl.querySelector(".activity-name-area");
    if (!targetArea) continue;

    // 既に差し込み済みならスキップ
    if (targetArea.querySelector(".mimo-grade")) continue;

    const container = document.createElement("div");
    container.className = "mimo-grade";

    if (entry.grade) {
      let maxScore: string | undefined;
      if (entry.range) {
        const parts = entry.range.split(/[–\-]/);
        const lastPart = parts[parts.length - 1];
        if (parts.length > 1 && lastPart !== undefined) {
          maxScore = lastPart.trim();
        }
      }

      const scoreSpan = document.createElement("span");
      scoreSpan.className = "mimo-grade-score";
      scoreSpan.textContent = maxScore
        ? `${entry.grade} / ${maxScore}`
        : entry.grade;
      container.appendChild(scoreSpan);

      if (entry.percentage) {
        const pctSpan = document.createElement("span");
        pctSpan.className = "mimo-grade-percentage";
        pctSpan.textContent = `(${entry.percentage})`;
        container.appendChild(pctSpan);
      }
    }

    if (entry.feedback) {
      const fbP = document.createElement("p");
      fbP.className = "mimo-grade-feedback";
      fbP.textContent = entry.feedback;
      container.appendChild(fbP);
    }

    targetArea.appendChild(container);
  }
}
