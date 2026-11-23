// コースセクション内の資料（modtype_resource）・フォルダ（modtype_folder）・ページ（modtype_page）を一括で保存するボタンを追加する。
// ページ資料の画面（mod/page/view.php）では、同じボタンで開いているページだけを保存する。

import { isCoursePage, isModPage } from "@/moodle/page";
import {
  activityLink,
  findCourseSectionHeaders,
  readActivityName,
  readSectionTitle,
} from "@/moodle/courseSections";
import { requestDownloads, saveBlob, type DownloadItem } from "@/utils/download";
import { sanitizeFilename } from "@/utils/filename";
import { lastPathSegment, readIdParam } from "@/utils/url";
import { collectPages, fetchPagesZip } from "./pageSave";
import type { PageSource } from "./pageSave.logic";
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
 * セクション内のフォルダ（modtype_folder）について、中身をまとめた ZIP の URL と保存名を収集する。
 * Moodle は ZIP の名前を `filename*` だけで返し、Firefox の downloads API はそれを読まないため、フォルダの名前から保存名を決める。
 */
export function collectFolders(section: Element): DownloadItem[] {
  const folders = new Map<string, DownloadItem>();
  for (const el of section.querySelectorAll("li.activity.modtype_folder")) {
    const anchor = activityLink(el);
    const id = anchor?.href && readIdParam(anchor.href);
    if (!id) {
      continue;
    }

    const url = new URL("/mod/folder/download_folder.php", anchor.href);
    url.searchParams.set("id", id);
    const name = readActivityName(el) || "フォルダ";
    folders.set(url.href, { url: url.href, filename: `${name}.zip` });
  }

  return Array.from(folders.values());
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

const BUTTON_MARKER = "mimo-bulk-download-button";

/**
 * 押されたら、ページを1つの ZIP（`<zipTitle>.zip`）にまとめて保存し、続けて files の保存を頼むようにする。
 */
function bindSave(
  button: HTMLButtonElement,
  label: string,
  pages: PageSource[],
  zipTitle: () => string,
  files: () => Promise<DownloadItem[]>,
): void {
  const save = async () => {
    button.disabled = true;
    try {
      const { zip, failed } = await fetchPagesZip(pages, (done, total) => {
        button.textContent = `ページを取得中（${done}/${total}）`;
      });
      if (zip) {
        saveBlob(zip, `${sanitizeFilename(zipTitle())}.zip`);
      }

      await requestDownloads(await files());
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

/**
 * ページ資料の画面の「完了マークする」の帯の右端へ、開いているページだけを保存するボタンを置く。
 */
function initModPageDownload(): void {
  const header = document.querySelector(
    '#region-main .activity-header[data-for="page-activity-header"]',
  );
  if (!header) {
    return;
  }

  const label = "資料を保存";
  const button = addSectionAction(header, BUTTON_MARKER, label);
  if (!button) {
    return;
  }

  const name =
    document.querySelector(".page-header-headings h1")?.textContent?.trim() || "ページ";
  bindSave(button, label, [{ name, url: location.href }], () => name, async () => []);
}

/**
 * コースページの各セクションヘッダーに資料一括保存ボタンを配置する。
 * ページ資料の画面では、開いているページだけを保存するボタンを置く。
 */
export function initBulkDownload(): void {
  if (isModPage()) {
    initModPageDownload();
    return;
  }
  if (!isCoursePage()) {
    return;
  }

  for (const { section, header } of findCourseSectionHeaders()) {
    const resourceUrls = collectResourceUrls(section);
    const folders = collectFolders(section);
    const pages = collectPages(section);
    const count = resourceUrls.length + folders.length + pages.length;
    if (count === 0) {
      continue;
    }

    const label = `資料を保存（${count}件）`;
    const button = addSectionAction(header, BUTTON_MARKER, label);
    if (!button) {
      continue;
    }

    bindSave(
      button,
      label,
      pages,
      () => readSectionTitle(section) || "ページ資料",
      async () => [...(await Promise.all(resourceUrls.map(resolveResource))), ...folders],
    );
  }
}
