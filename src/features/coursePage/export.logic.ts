// コースセクションのアクティビティを読み取り、Markdown またはプレーンテキストに整形する。

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
 * 要素の文章を、画面に見えている改行を保って読み取る。
 * 行末の空白を落とし、連続する空行を1つにまとめる。
 */
function readText(el: HTMLElement | null): string | undefined {
  if (!el) {
    return undefined;
  }

  const text = el.innerText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || undefined;
}

/**
 * セクション要素からタイトルと説明文、アクティビティ一覧を読み取る。
 */
export function readSection(section: Element): ExportedSection {
  const titleEl = section.querySelector(".sectionname");
  const title = titleEl?.textContent?.trim() || "セクション";

  const summaryEl = section.querySelector<HTMLElement>(".summarytext");
  const summary = readText(summaryEl);

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

    const itemEl = actEl.querySelector<HTMLElement>(".activity-item");
    let name = itemEl?.getAttribute("data-activityname")?.trim() || "";
    if (!name) {
      const linkEl = actEl.querySelector<HTMLElement>(".activityname a");
      name = linkEl?.textContent?.trim() || actEl.textContent?.trim() || "";
    }

    const anchorEl = actEl.querySelector<HTMLAnchorElement>(".activityname a");
    const url = anchorEl?.href || undefined;

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
      actEl.querySelector<HTMLElement>(".activity-altcontent"),
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
