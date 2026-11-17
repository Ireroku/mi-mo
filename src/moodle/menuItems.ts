// Moodle のナビゲーションバーに出ている項目の名前を読み取る。
// 設定画面が「隠す項目」の候補として使うため、読み取った結果は entrypoint がストレージへ控える。

const CONTAINER = "nav.navbar ul.more-nav, nav.navbar ul.navbar-nav";

/**
 * ナビゲーションバーの最上段の項目と、ドロップダウンの中の項目の名前を、出ている順に返す。
 * 幅が足りないときに出る「さらに」の開閉ボタンは項目ではないため除く。
 */
export function readMenuItemNames(): string[] {
  const container = document.querySelector<HTMLElement>(CONTAINER);
  if (!container) {
    return [];
  }

  const links = container.querySelectorAll<HTMLAnchorElement>(
    ":scope > li.nav-item:not(.dropdownmoremenu) > a, .dropdown-menu a.dropdown-item",
  );

  const names = new Set<string>();
  for (const a of links) {
    // ドロップダウンの中の項目は頭に「-」が付くことがある
    const name = (a.textContent ?? "").replace(/^[\s-]+/, "").trim();
    if (name !== "") {
      names.add(name);
    }
  }
  return [...names];
}
