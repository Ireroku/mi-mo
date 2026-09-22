// CSS を書いた style 要素をページへ1つ注入する。同じ id で呼び直すと中身を差し替える。

export function applyStyleSheet(id: string, css: string): void {
  const existing = document.getElementById(id);

  if (existing) {
    existing.textContent = css;
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
