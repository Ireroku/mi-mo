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
 * セクション要素からタイトルとアクティビティ一覧を読み取る。
 */
export function readSection(section: Element): ExportedSection {
  const titleEl = section.querySelector(".sectionname");
  const title = titleEl?.textContent?.trim() || "セクション";

  const activityEls = section.querySelectorAll<HTMLElement>("li.activity");
  const activities: ExportedActivity[] = [];

  for (const actEl of activityEls) {
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
      if (dates && dates.length === 0) dates = undefined;
    }

    let body: string | undefined;
    const altContentEl = actEl.querySelector(".activity-altcontent");
    if (altContentEl) {
      const bodyText = altContentEl.textContent?.trim();
      if (bodyText) {
        body = bodyText;
      }
    }

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
