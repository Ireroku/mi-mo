// 取得したページ資料（mod_page）の文書から、本文の Markdown と、埋め込まれたファイルの一覧を作る。

import { sanitizeFilename } from "@/utils/filename";
import { htmlToMarkdown } from "@/utils/markdown";
import { lastPathSegment } from "@/utils/url";

export interface PageSource {
  name: string; // ページ名。フォルダ名とファイル名に使う
  url: string; // /mod/page/view.php?id=<id>
}

export interface PageFiles {
  folder: string; // ZIP の中でこのページを入れるフォルダ名
  markdown: string; // 本文。<folder>/<folder>.md として保存する
  embedded: { url: string; name: string }[]; // 本文に埋め込まれたファイルと、フォルダの中での保存名
}

const CONTENT_SELECTOR = "#region-main .generalbox > .no-overflow";
const EMBEDDED_SELECTOR =
  "img[src], source[src], audio[src], video[src], a[href]";

/**
 * 画像の `data:` URL の MIME から拡張子（`.png` など）を返す。画像でなければ空文字を返す。
 */
function dataImageExtension(url: string): string {
  const subtype = /^data:image\/([a-z0-9.+-]+)/i.exec(url)?.[1]?.split("+")[0];
  return subtype ? `.${subtype.toLowerCase() === "jpeg" ? "jpg" : subtype}` : "";
}

/**
 * 取得したページの文書から、本文の Markdown と、埋め込まれたファイルの一覧を作る。
 * 本文が見つからない場合は null を返す。
 */
export function buildPageFiles(
  doc: Document,
  source: PageSource,
): PageFiles | null {
  const content = doc.querySelector(CONTENT_SELECTOR);
  if (!content) {
    return null;
  }

  const clone = content.cloneNode(true) as Element;
  const savedNames = new Map<string, string>(); // 絶対URL から保存名
  let imageCount = 0;

  for (const el of clone.querySelectorAll(EMBEDDED_SELECTOR)) {
    const attr = el.tagName === "A" ? "href" : "src";
    const raw = el.getAttribute(attr) ?? "";
    if (!URL.canParse(raw, source.url)) {
      continue;
    }

    const url = new URL(raw, source.url);
    // 本文へ直に埋め込まれた画像（data: URL）も、ファイルに分けて Markdown を読める長さに保つ。
    const isDataImage = el.tagName === "IMG" && url.protocol === "data:";
    if (!isDataImage && !url.pathname.includes("/pluginfile.php/")) {
      // 本文の外を指すリンクは、保存先から開けるよう絶対URLにしておく。
      el.setAttribute(attr, url.href);
      continue;
    }

    let savedName = savedNames.get(url.href);
    if (!savedName) {
      const original = isDataImage ? "" : sanitizeFilename(lastPathSegment(url));
      if (el.tagName === "IMG") {
        imageCount += 1;
        const dot = original.lastIndexOf(".");
        const ext = isDataImage
          ? dataImageExtension(url.href)
          : dot >= 0
            ? original.slice(dot)
            : "";
        savedName = `${String(imageCount).padStart(3, "0")}${ext}`;
      } else {
        savedName = original;
      }
      savedNames.set(url.href, savedName);
    }

    el.setAttribute(attr, encodeURI(savedName));
  }

  return {
    folder: sanitizeFilename(source.name),
    markdown: `# ${source.name}\n\n${source.url}\n\n${htmlToMarkdown(clone)}\n`,
    embedded: Array.from(savedNames, ([url, name]) => ({ url, name })),
  };
}
