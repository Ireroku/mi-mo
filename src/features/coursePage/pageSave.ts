// コースセクション内のページ資料（modtype_page）を集め、本文と画像を取得して1つのファイルにまとめる。

import { strToU8, zipSync } from "fflate";
import { activityLink, readActivityName } from "@/moodle/courseSections";
import {
  buildPageFiles,
  readFileTypes,
  type PageFiles,
  type PageSource,
} from "./pageSave.logic";

/**
 * セクション内のページ資料を集める。同じ名前のページは末尾へ番号を足して区別する。
 */
export function collectPages(section: Element): PageSource[] {
  const pages: PageSource[] = [];
  const nameCounts = new Map<string, number>();

  for (const el of section.querySelectorAll("li.activity.modtype_page")) {
    const anchor = activityLink(el);
    if (!anchor?.href) {
      continue;
    }

    const baseName = readActivityName(el) || "ページ";
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

async function fetchDocument(url: string): Promise<Document> {
  const response = await fetchOk(url);
  return new DOMParser().parseFromString(await response.text(), "text/html");
}

/**
 * 課題の提出画面（`action=editsubmission`）を取得し、提出できるファイルの拡張子を読む。
 * 提出画面を開けない課題や、取得に失敗した場合は空の配列を返す。
 * 取得は GET だけで、Moodle が提出を変える操作に要求する sesskey を送らないため、提出の内容は変わらない。
 */
export async function fetchFileTypes(doc: Document, url: string): Promise<string[]> {
  if (!doc.querySelector('form input[name="action"][value="editsubmission"]')) {
    return [];
  }

  try {
    const editUrl = new URL(url);
    editUrl.searchParams.set("action", "editsubmission");
    return readFileTypes(await fetchDocument(editUrl.href));
  } catch (error) {
    console.error("[mi-mo] pageSave file types", url, error);
    return [];
  }
}

/**
 * ページを1件ずつ取得し、本文と埋め込まれたファイルを1つの ZIP（`<zipTitle>.zip`）にまとめる。本文の作り方は build で差し替えられる（既定はページ資料）。
 * 中身が .md の1件だけなら、ZIP にせず `<フォルダ名>.md` のファイルにする。
 * 本文か、埋め込まれたファイルのどれかを取得できなかったページの件数を failed に入れる。
 * 1件も入れられなかった場合、file は null になる。
 */
export async function fetchPagesFile(
  pages: PageSource[],
  zipTitle: string,
  onProgress: (done: number, total: number) => void,
  build: (doc: Document, page: PageSource) => Promise<PageFiles | null> = async (doc, page) =>
    buildPageFiles(doc, page),
): Promise<{ file: File | null; failed: number }> {
  const files: Record<string, Uint8Array<ArrayBuffer>> = {};
  let failed = 0;

  for (const [index, page] of pages.entries()) {
    try {
      const built = await build(await fetchDocument(page.url), page);
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

  const [first, ...rest] = Object.entries(files);
  if (!first) {
    return { file: null, failed };
  }
  if (rest.length === 0) {
    const [path, data] = first;
    const name = path.slice(path.lastIndexOf("/") + 1);
    return { file: new File([data], name, { type: "text/markdown;charset=utf-8" }), failed };
  }

  const zip = zipSync(files, { level: 0 });
  return { file: new File([zip], `${zipTitle}.zip`, { type: "application/zip" }), failed };
}
