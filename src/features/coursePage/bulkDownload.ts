// コースセクション内の資料（modtype_resource）を一括ダウンロードするボタンを追加する。

import { isCoursePage } from "@/moodle/page";
import { requestDownloads } from "@/utils/download";

/**
 * セクション内の資料（modtype_resource）の URL を重複なく収集する。
 */
export function collectResourceUrls(section: Element): string[] {
  const resourceEls = section.querySelectorAll<HTMLElement>(
    "li.activity.modtype_resource",
  );
  const urls: string[] = [];

  for (const el of resourceEls) {
    const anchor = el.querySelector<HTMLAnchorElement>(".activityname a");
    if (anchor?.href) {
      urls.push(anchor.href);
    }
  }

  return Array.from(new Set(urls));
}

/**
 * コースページの各セクションヘッダーに資料一括保存ボタンを配置する。
 */
export function initBulkDownload(): void {
  if (!isCoursePage()) return;

  const sections = document.querySelectorAll(
    '#region-main div.course-content > div > ul[data-for="course_sectionlist"] > li.section',
  );

  for (const section of sections) {
    const urls = collectResourceUrls(section);
    if (urls.length === 0) continue;

    const header = section.querySelector(".course-section-header");
    if (!header) continue;

    // 既にボタンが存在する場合は追加しない
    if (header.querySelector(".mimo-bulk-download-button")) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "btn btn-outline-secondary btn-sm text-nowrap mimo-bulk-download-button ml-2";
    button.textContent = `資料を保存（${urls.length}件）`;

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const items = urls.map((url) => ({ url }));
      requestDownloads(items);
    });

    header.appendChild(button);
  }
}
