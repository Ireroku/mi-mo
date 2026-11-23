// 取得したページ資料（mod_page）と課題（mod_assign）の文書から、本文の Markdown と、埋め込まれたファイルの一覧を作る。

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
 * 本文の要素を Markdown にし、埋め込まれたファイルの一覧を作る。渡した要素は書き換えない。
 */
function convertContent(
  content: Element,
  source: PageSource,
): { body: string; embedded: PageFiles["embedded"] } {
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
    body: htmlToMarkdown(clone),
    embedded: Array.from(savedNames, ([url, name]) => ({ url, name })),
  };
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

  const { body, embedded } = convertContent(content, source);
  return {
    folder: sanitizeFilename(source.name),
    markdown: `# ${source.name}\n\n${source.url}\n\n${body}\n`,
    embedded,
  };
}

const ASSIGN_HEADER_SELECTOR = '#region-main .activity-header[data-for="page-activity-header"]';

// 課題の日付の見出し。Moodle は開始の前後で文言を変える（英語では Opens / Opened）。
const DATE_KEYS: [RegExp, string][] = [
  [/開始|Open/, "start"],
  [/期限|Due/, "due"],
];

/**
 * Moodle の日時（`2026年 10月 26日(月曜日) 23:59`）を `2026-10-26T23:59` にする。読めなければ null を返す。
 */
export function parseMoodleDate(text: string): string | null {
  const match = /(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日.*?(\d{1,2}):(\d{2})/.exec(text);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const pad = (value = "") => value.padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${minute}`;
}

/**
 * 課題の提出画面（`action=editsubmission`）から、提出できるファイルの拡張子を読む。制限が無ければ空の配列を返す。
 */
export function readFileTypes(doc: Document): string[] {
  const names = Array.from(
    doc.querySelectorAll(".form-filetypes-descriptions li small"),
    (el) => el.textContent ?? "",
  );
  return Array.from(new Set(names.join(" ").split(/\s+/).filter(Boolean)));
}

/**
 * 値を YAML の1行にする。文字列は JSON の書き方で引用し、記号を含む名前でも崩れないようにする。
 */
function yamlField(key: string, value: string | string[]): string {
  if (Array.isArray(value)) {
    return [`${key}:`, ...value.map((item) => `  - ${JSON.stringify(item)}`)].join("\n");
  }
  return `${key}: ${value}`;
}

/**
 * 取得した課題の画面から、説明文の Markdown と、埋め込まれたファイルの一覧を作る。
 * 名前・URL・開始と期限の日時・提出できるファイルの拡張子は、YAML の Frontmatter に書く。
 * 課題の帯が見つからない場合は null を返す。
 */
export function buildAssignFiles(
  doc: Document,
  source: PageSource,
  fileTypes: string[],
): PageFiles | null {
  const header = doc.querySelector(ASSIGN_HEADER_SELECTOR);
  if (!header) {
    return null;
  }

  const fields = [
    yamlField("title", JSON.stringify(source.name)),
    yamlField("url", JSON.stringify(source.url)),
  ];
  for (const row of header.querySelectorAll(".activity-dates > div")) {
    const label = row.querySelector("strong")?.textContent ?? "";
    const key = DATE_KEYS.find(([pattern]) => pattern.test(label))?.[1];
    const date = parseMoodleDate(row.textContent ?? "");
    if (key && date) {
      fields.push(yamlField(key, date));
    }
  }
  if (fileTypes.length > 0) {
    fields.push(yamlField("file_types", fileTypes));
  }

  const description = header.querySelector(".activity-description");
  const { body, embedded } = description
    ? convertContent(description, source)
    : { body: "", embedded: [] };
  return {
    folder: sanitizeFilename(source.name),
    markdown: `---\n${fields.join("\n")}\n---\n\n${body}${body ? "\n" : ""}`,
    embedded,
  };
}
