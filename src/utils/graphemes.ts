// 文字列を書記素（見た目の1文字）の単位で数え、切り、詰める。
// 時計の時限とカウントダウンのラベルが、同じ数え方で文字数を決めるために使う。

export const ELLIPSIS = "…";

/**
 * 書記素の配列に分ける。結合文字や ZWJ でつないだ絵文字を途中で割らない。
 */
export function splitGraphemes(text: string): string[] {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }

  // Intl.Segmenter が無い環境では、コードポイント単位で切る
  return Array.from(text);
}

/**
 * size 文字ごとに区切った配列を返す。空文字では空の配列を返す。
 */
export function chunkGraphemes(text: string, size: number): string[] {
  const chars = splitGraphemes(text);
  const chunks: string[] = [];
  for (let i = 0; i < chars.length; i += size) {
    chunks.push(chars.slice(i, i + size).join(""));
  }
  return chunks;
}

/**
 * max 文字を超える場合、先頭の max - 1 文字に「…」を足して max 文字に収める。
 */
export function truncateGraphemes(text: string, max: number): string {
  const chars = splitGraphemes(text);
  if (chars.length <= max) {
    return text;
  }
  return chars.slice(0, max - 1).join("") + ELLIPSIS;
}
