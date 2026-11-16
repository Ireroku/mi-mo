// コースセクション内の資料（modtype_resource）とページ（modtype_page）を一括で保存するボタンを追加する。

import { isCoursePage } from "@/moodle/page";
import { findCourseSectionHeaders } from "@/moodle/courseSections";
import { requestDownloads } from "@/utils/download";
import { collectPages, fetchPageDownloads } from "./pageSave";

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
    const pages = collectPages(section);
    if (urls.length + pages.length === 0) {
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
    const label = `資料を保存（${urls.length + pages.length}件）`;
    button.textContent = label;

    const save = async () => {
      button.disabled = true;
      try {
        const { items, failed } = await fetchPageDownloads(
          pages,
          (done, total) => {
            button.textContent = `ページを取得中（${done}/${total}）`;
          },
        );
        await requestDownloads([...urls.map((url) => ({ url })), ...items]);
        button.textContent =
          failed > 0 ? `${failed}件のページを保存できませんでした` : label;
      } catch (error) {
        console.error("[mi-mo] bulkDownload", error);
        button.textContent = "保存に失敗しました";
      } finally {
        button.disabled = false;
      }
    };

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      void save();
    });

    header.appendChild(button);
  }
}
