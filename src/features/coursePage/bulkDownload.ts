// コースセクション内の資料（modtype_resource）・フォルダ（modtype_folder）・ページ（modtype_page）を一括で保存するボタンを追加する。

import { isCoursePage } from "@/moodle/page";
import {
  activityLink,
  findCourseSectionHeaders,
  readSectionTitle,
} from "@/moodle/courseSections";
import { requestDownloads, saveBlob, type DownloadItem } from "@/utils/download";
import { sanitizeFilename } from "@/utils/filename";
import { lastPathSegment, readIdParam } from "@/utils/url";
import { collectPages, fetchPagesZip } from "./pageSave";
import { addSectionAction } from "./sectionActions";

/**
 * セクション内の資料（modtype_resource）の URL を重複なく収集する。
 */
export function collectResourceUrls(section: Element): string[] {
  const resourceEls = section.querySelectorAll<HTMLElement>(
    "li.activity.modtype_resource",
  );
  const urls: string[] = [];
  for (const el of resourceEls) {
    const anchor = activityLink(el);
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
 * セクション内のフォルダ（modtype_folder）について、中身をまとめた ZIP の URL を収集する。
 */
export function collectFolderUrls(section: Element): string[] {
  const urls: string[] = [];
  for (const el of section.querySelectorAll("li.activity.modtype_folder")) {
    const anchor = activityLink(el);
    const id = anchor?.href && readIdParam(anchor.href);
    if (!id) {
      continue;
    }

    const url = new URL("/mod/folder/download_folder.php", anchor.href);
    url.searchParams.set("id", id);
    urls.push(url.href);
  }

  return Array.from(new Set(urls));
}

/**
 * 資料の URL を転送先のファイル本体の URL へ解決し、ファイル名を添える。
 * Firefox の downloads API は転送元の URL からファイル名を決めるため、解決しないと view.php の名前で保存される。
 * 解決できなければ元の URL のまま返す。
 */
async function resolveResource(url: string): Promise<DownloadItem> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const name = lastPathSegment(new URL(response.url));
    if (response.ok && name) {
      return { url: response.url, filename: name };
    }
  } catch (error) {
    console.error("[mi-mo] bulkDownload resolve", error);
  }
  return { url };
}

/**
 * コースページの各セクションヘッダーに資料一括保存ボタンを配置する。
 */
export function initBulkDownload(): void {
  if (!isCoursePage()) {
    return;
  }

  for (const { section, header } of findCourseSectionHeaders()) {
    const resourceUrls = collectResourceUrls(section);
    const folderUrls = collectFolderUrls(section);
    const pages = collectPages(section);
    const count = resourceUrls.length + folderUrls.length + pages.length;
    if (count === 0) {
      continue;
    }

    const label = `資料を保存（${count}件）`;
    const button = addSectionAction(header, "mimo-bulk-download-button", label);
    if (!button) {
      continue;
    }

    const save = async () => {
      button.disabled = true;
      try {
        const { zip, failed } = await fetchPagesZip(pages, (done, total) => {
          button.textContent = `ページを取得中（${done}/${total}）`;
        });
        if (zip) {
          const title = readSectionTitle(section) || "ページ資料";
          saveBlob(zip, `${sanitizeFilename(title)}.zip`);
        }

        const resources = await Promise.all(resourceUrls.map(resolveResource));
        await requestDownloads([...resources, ...folderUrls.map((url) => ({ url }))]);
        button.textContent =
          failed > 0 ? `${failed}件のページに保存できない内容がありました` : label;
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
  }
}
