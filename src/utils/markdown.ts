// HTML の要素を Markdown またはプレーンテキストへ変換する。変換は Turndown に任せ、Moodle の HTML に合わないもの（pre・表・数式）だけ規則を足す。

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

// Moodle のエディタは pre の中へ code を入れず、改行を br、空白を &nbsp; で書く。
// Turndown の既定の規則は pre > code だけを囲み付きのコードにするため、pre を丸ごと扱う。
markdown.addRule("preformatted", {
  filter: "pre",
  replacement: (_content, node) => {
    const code = preText(node).replace(/ /g, " ").replace(/\n+$/, "");
    const longest = Math.max(0, ...(code.match(/`+/g) ?? []).map((run) => run.length));
    const fence = "`".repeat(Math.max(3, longest + 1));
    const codeClass = (node as Element).querySelector("code")?.className ?? "";
    const language = /(?:^|\s)language-(\S+)/.exec(codeClass)?.[1] ?? "";
    return `\n\n${fence}${language}\n${code}\n${fence}\n\n`;
  },
});

/**
 * pre の中の文字列を、br を改行にして返す。
 */
function preText(node: Node): string {
  if (node.nodeName === "BR") {
    return "\n";
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue ?? "";
  }
  return Array.from(node.childNodes, preText).join("");
}

// 表は GFM の表にする。Moodle の表はたいてい th を持たないため、1行目を見出しの行にする。
// セルの結合と入れ子の表は Markdown で書けないため、HTML のまま残す。
function isMarkdownTable(table: Element): boolean {
  return !table.querySelector(
    "table, [colspan]:not([colspan='1']), [rowspan]:not([rowspan='1'])",
  );
}

function inMarkdownTable(node: Node): boolean {
  const table = (node as Element).closest("table");
  return table !== null && isMarkdownTable(table);
}

markdown.keep((node) => node.nodeName === "TABLE" && !isMarkdownTable(node));

markdown.addRule("table", {
  filter: (node) => node.nodeName === "TABLE" && isMarkdownTable(node),
  replacement: (content) => `\n\n${content.trim()}\n\n`,
});

markdown.addRule("tableSection", {
  filter: (node) =>
    ["THEAD", "TBODY", "TFOOT"].includes(node.nodeName) && inMarkdownTable(node),
  replacement: (content) => content,
});

// 見出しの行の区切りは、表でいちばん多いセルの数に合わせる。GFM は見出しより多いセルを捨てるため、足りない行は空のセルで埋める。
markdown.addRule("tableRow", {
  filter: (node) => node.nodeName === "TR" && inMarkdownTable(node),
  replacement: (content, node) => {
    const table = (node as Element).closest("table") as HTMLTableElement;
    const columns = Math.max(...Array.from(table.rows, (row) => row.cells.length));
    const padding = " |".repeat(columns - (node as HTMLTableRowElement).cells.length);
    const row = `\n|${content}${padding}`;
    if (node !== table.rows[0]) {
      return row;
    }
    return `${row}\n|${" --- |".repeat(columns)}`;
  },
});

// セルの中の改行は表を壊すため <br> にし、区切りの | はエスケープする。
markdown.addRule("tableCell", {
  filter: (node) => ["TD", "TH"].includes(node.nodeName) && inMarkdownTable(node),
  replacement: (content) =>
    ` ${content.trim().replace(/ *\n+ */g, "<br>").replace(/\|/g, "\\|")} |`,
});

// MathJax の数式（\( \)・\[ \]・$$ $$）は TeX をエスケープせずに残し、$ と $$ で囲む。
// 多くのエディタが $ の書き方を数式として読み、読めない環境でも TeX の記号がそのまま残る。
// 数式でない $ は、数式の始まりと読まれないようエスケープする。
const MATH = /\\\((.+?)\\\)|\\\[(.+?)\\\]|\$\$(.+?)\$\$/gs;

function escapeText(text: string): string {
  return TurndownService.prototype.escape.call(markdown, text).replace(/\$/g, "\\$");
}

markdown.escape = (text) => {
  let result = "";
  let last = 0;
  for (const match of text.matchAll(MATH)) {
    const [whole, inline, bracket, dollars] = match;
    result += escapeText(text.slice(last, match.index));
    result +=
      inline !== undefined
        ? `$${inline.trim()}$`
        : `\n\n$$\n${(bracket ?? dollars ?? "").trim()}\n$$\n\n`;
    last = match.index + whole.length;
  }
  return result + escapeText(text.slice(last));
};

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
