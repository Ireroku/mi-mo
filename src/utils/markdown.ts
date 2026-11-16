// HTML の要素を Markdown またはプレーンテキストへ変換する。変換の規則は Turndown に任せる。

import TurndownService from "turndown";

const OPTIONS: TurndownService.Options = {
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
};

const markdown = new TurndownService(OPTIONS);

// 音声と動画は Markdown に対応する記法が無いため、ファイルへのリンクにする。
markdown.addRule("media", {
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

// プレーンテキストでは、段落とリストの形だけを残し、記号で表す書式を落とす。
const plain = new TurndownService({ ...OPTIONS, br: "" });
plain.escape = (text) => text;
plain.addRule("emphasis", {
  filter: ["strong", "b", "em", "i"],
  replacement: (content) => content,
});
plain.addRule("heading", {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
  replacement: (content) => `\n\n${content}\n\n`,
});
plain.addRule("link", {
  filter: "a",
  replacement: (content, node) => {
    const href = (node as Element).getAttribute("href");
    if (!href || href === content) {
      return content;
    }

    return content ? `${content} (${href})` : href;
  },
});
plain.addRule("image", {
  filter: "img",
  replacement: (_content, node) => (node as Element).getAttribute("alt") ?? "",
});

/**
 * 要素の中身を Markdown にする。渡した要素は書き換えない。
 */
export function htmlToMarkdown(el: Element): string {
  return markdown.turndown(el as HTMLElement);
}

/**
 * 要素の中身を、段落とリストの区切りを保ったプレーンテキストにする。渡した要素は書き換えない。
 */
export function htmlToPlainText(el: Element): string {
  return plain.turndown(el as HTMLElement);
}
