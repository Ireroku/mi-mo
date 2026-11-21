// コースセクションのアクティビティを読み取り、Markdown またはプレーンテキストに整形する。

import {
  activityLink,
  readActivityName,
  readSectionTitle,
} from "@/moodle/courseSections";
import { htmlToMarkdown, htmlToPlainText } from "@/utils/markdown";

export type ExportFormat = "markdown" | "text";

export interface ExportedActivity {
  name: string;
  kind: string; // modtype_ に続く種別
  url?: string;
  dates?: string[];
  body?: string; // ラベルの本文
}

export interface ExportedSection {
  title: string;
  summary?: string; // セクションの説明文
  activities: ExportedActivity[];
}

const KIND_MAP: Record<string, string | null> = {
  resource: "ファイル",
  assign: "課題",
  url: "URL",
  forum: "フォーラム",
  page: "ページ",
  quiz: "小テスト",
  autoattendmod: "出欠",
  label: null, // 種別を出さない
};

function resolveKindLabel(kind: string): string | null {
  const label = KIND_MAP[kind];
  if (label !== undefined) {
    return label;
  }

  return kind;
}

/**
 * 要素の文章を、段落とリストの区切りを保って読み取る。
 */
function readText(el: Element | null, format: ExportFormat): string | undefined {
  if (!el) {
    return undefined;
  }

  const text = format === "markdown" ? htmlToMarkdown(el) : htmlToPlainText(el);
  return text.trim() || undefined;
}

/**
 * セクション要素からタイトルと説明文、アクティビティ一覧を読み取る。
 * 説明文とラベルの本文は、format の形式の文字列にする。
 */
export function readSection(
  section: Element,
  format: ExportFormat,
): ExportedSection {
  const title = readSectionTitle(section) || "セクション";

  const summaryEl = section.querySelector<HTMLElement>(".summarytext");
  const summary = readText(summaryEl, format);

  const activityEls = section.querySelectorAll<HTMLElement>("li.activity");
  const activities: ExportedActivity[] = [];
  for (const actEl of activityEls) {
    // 説明文には教員が貼った HTML が入り、活動に似た要素が紛れる場合がある。
    if (summaryEl?.contains(actEl)) {
      continue;
    }

    let kind = "";
    for (const cls of actEl.classList) {
      if (cls.startsWith("modtype_")) {
        kind = cls.replace("modtype_", "");
        break;
      }
    }

    const name = readActivityName(actEl) || actEl.textContent?.trim() || "";
    const url = activityLink(actEl)?.href || undefined;

    let dates: string[] | undefined;
    const datesEl = actEl.querySelector('[data-region="activity-dates"]');
    if (datesEl) {
      const childDivs = datesEl.querySelectorAll("div");
      if (childDivs.length > 0) {
        dates = Array.from(childDivs)
          .map((d) => d.textContent?.trim() || "")
          .filter((t) => t.length > 0);
      } else {
        const text = datesEl.textContent?.trim();
        if (text) {
          dates = text
            .split(/\r?\n/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
        }
      }
      if (dates && dates.length === 0) {
        dates = undefined;
      }
    }

    const body = readText(
      actEl.querySelector(".activity-altcontent"),
      format,
    );

    activities.push({
      name,
      kind,
      url,
      dates,
      body,
    });
  }

  return {
    title,
    summary,
    activities,
  };
}

/**
 * セクション情報を指定の形式（markdown / text）の文字列に整形する。
 */
export function formatSection(
  section: ExportedSection,
  format: ExportFormat,
): string {
  if (format === "markdown") {
    const blocks: string[] = [`## ${section.title}`];
    if (section.summary) {
      blocks.push(section.summary);
    }
    for (const act of section.activities) {
      if (act.kind === "label") {
        if (act.body) {
          blocks.push(act.body);
        }
        continue;
      }

      const kindLabel = resolveKindLabel(act.kind);
      const parts: string[] = [];
      let titlePart = act.name;
      if (act.url) {
        titlePart = `[${act.name}](${act.url})`;
      }
      if (kindLabel) {
        titlePart += ` — ${kindLabel}`;
      }
      parts.push(`- ${titlePart}`);

      if (act.dates && act.dates.length > 0) {
        for (const date of act.dates) {
          parts.push(`  - ${date}`);
        }
      }

      blocks.push(parts.join("\n"));
    }

    return blocks.join("\n\n") + "\n";
  }

  // format === "text"
  const blocks: string[] = [section.title];
  if (section.summary) {
    blocks.push(section.summary);
  }
  for (const act of section.activities) {
    if (act.kind === "label") {
      if (act.body) {
        blocks.push(act.body);
      }
      continue;
    }

    const kindLabel = resolveKindLabel(act.kind);
    const parts: string[] = [];
    const labelPart = kindLabel ? `（${kindLabel}）` : "";
    parts.push(`${act.name}${labelPart}`);

    if (act.url) {
      parts.push(`  ${act.url}`);
    }

    if (act.dates && act.dates.length > 0) {
      for (const date of act.dates) {
        parts.push(`  ${date}`);
      }
    }

    blocks.push(parts.join("\n"));
  }

  return blocks.join("\n\n") + "\n";
}
