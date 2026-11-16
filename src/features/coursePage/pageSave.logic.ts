// 取得したページ資料（mod_page）の文書から、Markdown と保存するファイルの一覧を作る。

import TurndownService from "turndown";
import { toTextDataUrl, type DownloadItem } from "@/utils/download";
import { sanitizeFilename } from "@/utils/filename";

export interface PageSource {
  name: string; // ページ名。フォルダ名とファイル名に使う
  url: string; // /mod/page/view.php?id=<id>
}

const CONTENT_SELECTOR = "#region-main .generalbox > .no-overflow";
const EMBEDDED_SELECTOR =
  "img[src], source[src], audio[src], video[src], a[href]";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// 音声と動画は Markdown に対応する記法が無いため、ファイルへのリンクにする。
turndown.addRule("media", {
  filter: ["audio", "video"],
  replacement: (_content, node) => {
    const media = node as Element;
    const src =
      media.getAttribute("src") ??
      media.querySelector("source[src]")?.getAttribute("src");
    if (!src) {
      return "";
    }

    return `[${decodeURI(src)}](${src})`;
  },
});

function lastSegment(url: URL): string {
  const segment = url.pathname.split("/").pop() ?? "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * 取得したページの文書から、保存するファイルの一覧を作る。
 * 先頭が本文の Markdown、残りが埋め込まれたファイル。
 * 本文が見つからない場合は空の配列を返す。
 */
export function buildPageDownloads(
  doc: Document,
  source: PageSource,
): DownloadItem[] {
  const content = doc.querySelector(CONTENT_SELECTOR);
  if (!content) {
    return [];
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
    if (!url.pathname.includes("/pluginfile.php/")) {
      // 本文の外を指すリンクは、保存先から開けるよう絶対URLにしておく。
      el.setAttribute(attr, url.href);
      continue;
    }

    let savedName = savedNames.get(url.href);
    if (!savedName) {
      const original = sanitizeFilename(lastSegment(url));
      if (el.tagName === "IMG") {
        imageCount += 1;
        const dot = original.lastIndexOf(".");
        const ext = dot >= 0 ? original.slice(dot) : "";
        savedName = `${String(imageCount).padStart(3, "0")}${ext}`;
      } else {
        savedName = original;
      }
      savedNames.set(url.href, savedName);
    }

    el.setAttribute(attr, encodeURI(savedName));
  }

  const folder = sanitizeFilename(source.name);
  const markdown = `# ${source.name}\n\n${source.url}\n\n${turndown.turndown(clone as HTMLElement)}\n`;

  return [
    {
      url: toTextDataUrl(markdown, "text/markdown"),
      filename: `${folder}/${folder}.md`,
    },
    ...Array.from(savedNames, ([url, savedName]) => ({
      url,
      filename: `${folder}/${savedName}`,
    })),
  ];
}
