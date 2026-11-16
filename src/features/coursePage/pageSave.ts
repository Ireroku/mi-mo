// コースセクション内のページ資料（modtype_page）を集め、本文を取得する。

import type { DownloadItem } from "@/utils/download";
import { buildPageDownloads, type PageSource } from "./pageSave.logic";

/**
 * セクション内のページ資料を集める。同じ名前のページは末尾へ番号を足して区別する。
 */
export function collectPages(section: Element): PageSource[] {
  const pages: PageSource[] = [];
  const nameCounts = new Map<string, number>();

  for (const el of section.querySelectorAll("li.activity.modtype_page")) {
    const anchor = el.querySelector<HTMLAnchorElement>(".activityname a");
    if (!anchor?.href) {
      continue;
    }

    const baseName =
      el
        .querySelector(".activity-item")
        ?.getAttribute("data-activityname")
        ?.trim() ||
      anchor.textContent?.trim() ||
      "ページ";
    const count = (nameCounts.get(baseName) ?? 0) + 1;
    nameCounts.set(baseName, count);

    pages.push({
      name: count === 1 ? baseName : `${baseName} (${count})`,
      url: anchor.href,
    });
  }

  return pages;
}

/**
 * ページを1件ずつ取得し、保存するファイルの一覧をまとめて返す。
 * 取得に失敗したページは飛ばし、その件数を failed に入れる。
 */
export async function fetchPageDownloads(
  pages: PageSource[],
  onProgress: (done: number, total: number) => void,
): Promise<{ items: DownloadItem[]; failed: number }> {
  const items: DownloadItem[] = [];
  let failed = 0;

  for (const [index, page] of pages.entries()) {
    try {
      const response = await fetch(page.url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const doc = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const pageItems = buildPageDownloads(doc, page);
      if (pageItems.length === 0) {
        throw new Error("本文が見つかりません");
      }

      items.push(...pageItems);
    } catch (error) {
      console.error("[mi-mo] pageSave", page.url, error);
      failed += 1;
    }

    onProgress(index + 1, pages.length);
  }

  return { items, failed };
}
