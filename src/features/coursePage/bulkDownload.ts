// コースセクション内の資料（modtype_resource）を一括ダウンロードするボタンを追加する。

import { isCoursePage } from "@/moodle/page";
import { findCourseSectionHeaders } from "@/moodle/courseSections";
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
    if (!anchor?.href) {
      continue;
    }

    // 埋め込み表示に設定された資料は、そのままだと表示用のページが返る。
    // redirect=1 を付けると、表示設定にかかわらずファイル本体へ転送される。
    const url = new URL(anchor.href);
    url.searchParams.set("redirect", "1");
    urls.push(url.href);
  }

  return Array.from(new Set(urls));
}

/**
 * コースページの各セクションヘッダーに資料一括保存ボタンを配置する。
 */
export function initBulkDownload(): void {
  if (!isCoursePage()) {
    return;
  }

  for (const { section, header } of findCourseSectionHeaders()) {
    const urls = collectResourceUrls(section);
    if (urls.length === 0) {
      continue;
    }

    // 既にボタンが存在する場合は追加しない
    if (header.querySelector(".mimo-bulk-download-button")) {
      continue;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "btn btn-outline-secondary btn-sm text-nowrap mimo-bulk-download-button ml-2";
    button.textContent = `資料を保存（${urls.length}件）`;

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const items = urls.map((url) => ({ url }));
      requestDownloads(items).catch((error: unknown) => {
        console.error("[mi-mo] bulkDownload", error);
        button.textContent = "保存に失敗しました";
      });
    });

    header.appendChild(button);
  }
}
