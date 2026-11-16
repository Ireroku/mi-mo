// コースセクション内のページ資料（modtype_page）を集め、本文と画像を取得して ZIP にまとめる。

import { strToU8, zipSync } from "fflate";
import { buildPageFiles, type PageSource } from "./pageSave.logic";

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

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response;
}

/**
 * ページを1件ずつ取得し、本文と埋め込まれたファイルを1つの ZIP にまとめる。
 * 本文か、埋め込まれたファイルのどれかを取得できなかったページの件数を failed に入れる。
 * 1件も入れられなかった場合、zip は null になる。
 */
export async function fetchPagesZip(
  pages: PageSource[],
  onProgress: (done: number, total: number) => void,
): Promise<{ zip: Blob | null; failed: number }> {
  const files: Record<string, Uint8Array> = {};
  let failed = 0;

  for (const [index, page] of pages.entries()) {
    try {
      const response = await fetchOk(page.url);
      const doc = new DOMParser().parseFromString(
        await response.text(),
        "text/html",
      );
      const built = buildPageFiles(doc, page);
      if (!built) {
        throw new Error("本文が見つかりません");
      }

      const { folder, markdown, embedded } = built;
      files[`${folder}/${folder}.md`] = strToU8(markdown);

      // 取得できなかったファイルがあっても、残りは ZIP へ入れる。
      const results = await Promise.allSettled(
        embedded.map(async ({ url, name }) => {
          const file = await fetchOk(url);
          files[`${folder}/${name}`] = new Uint8Array(await file.arrayBuffer());
        }),
      );
      const rejected = results.filter((result) => result.status === "rejected");
      if (rejected.length > 0) {
        throw new Error(`${rejected.length}件のファイルを取得できませんでした`);
      }
    } catch (error) {
      console.error("[mi-mo] pageSave", page.url, error);
      failed += 1;
    }

    onProgress(index + 1, pages.length);
  }

  if (Object.keys(files).length === 0) {
    return { zip: null, failed };
  }

  // 中身の大半は圧縮済みの画像のため、圧縮せずにまとめる。
  const zip = new Blob([zipSync(files, { level: 0 })], {
    type: "application/zip",
  });
  return { zip, failed };
}
