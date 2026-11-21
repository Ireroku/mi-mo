// CSS を書いた style 要素をページへ1つ注入する。同じ id で呼び直すと中身を差し替える。

const ID_PREFIX = "mimo-";

export function applyStyleSheet(id: string, css: string): void {
  const existing = document.getElementById(id);
  if (existing) {
    // 同じ中身を入れ直すと、スタイルの再計算が走る
    if (existing.textContent !== css) {
      existing.textContent = css;
    }
    return;
  }

  if (css === "") {
    return;
  }

  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  (document.head ?? document.documentElement).appendChild(style);
}

/**
 * applyStyleSheet で注入した style 要素をすべて外す。
 */
export function removeAllStyleSheets(): void {
  for (const style of document.querySelectorAll(`style[id^="${ID_PREFIX}"]`)) {
    style.remove();
  }
}
