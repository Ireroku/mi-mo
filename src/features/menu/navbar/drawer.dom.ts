import type { MenuConfig, NewMenuItem } from "./types";

const CONTAINER_SELECTOR =
  "#theme_boost-drawers-primary .drawercontent .list-group, #theme_boost-drawers-primary .list-group";

// 照合に使う値を項目ごとに1度だけ読んだもの。隠す対象の数だけ DOM を読み直さないため
interface DrawerEntry {
  el: HTMLElement;
  dataKey: string | null;
  // 照合する href。絶対 URL と属性の値の2つ。ページ内リンクの場合は null
  hrefs: [string, string] | null;
  text: string;
}

/**
 * モバイル表示のドロワーへ、項目の非表示と追加を適用する。
 */
export function applyDrawerMenu(config: MenuConfig): void {
  const container = document.querySelector<HTMLElement>(CONTAINER_SELECTOR);
  if (!container) {
    return;
  }

  const hidden = config.hidden ?? [];
  if (hidden.length > 0) {
    const topLevelEntries = Array.from(container.children)
      .filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && !child.classList.contains("collapse"),
      )
      .map(readEntry);
    const subEntries = Array.from(
      container.querySelectorAll<HTMLElement>(".collapse a.list-group-item"),
      readEntry,
    );

    for (const target of hidden) {
      hideItem(container, topLevelEntries, subEntries, target);
    }
  }

  for (const item of config.items ?? []) {
    insertItem(container, item);
  }
}

function readEntry(el: HTMLElement): DrawerEntry {
  const primaryAnchor =
    el instanceof HTMLAnchorElement
      ? el
      : el.querySelector<HTMLAnchorElement>(":scope > a, a");
  const hrefAttr = primaryAnchor?.getAttribute("href");
  const hrefs: [string, string] | null =
    primaryAnchor && hrefAttr && !hrefAttr.startsWith("#")
      ? [primaryAnchor.href, hrefAttr]
      : null;

  // 入れ子の開閉メニューと読み上げ用の文言を除いたテキスト
  let text = "";
  if (el.children.length === 0) {
    text = el.textContent ?? "";
  } else {
    const clone = el.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(".collapse, .sr-only, .visually-hidden")
      .forEach((node) => node.remove());
    text = clone.textContent ?? "";
  }
  text = text
    .replace(/折りたたむ/g, "")
    .replace(/展開する/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return { el, dataKey: el.getAttribute("data-key"), hrefs, text };
}

function matchesTarget(entry: DrawerEntry, target: string): boolean {
  if (!target) {
    return false;
  }

  if (entry.el.classList.contains("collapse")) {
    return false;
  }

  const targetLower = target.toLowerCase().trim();
  if (!targetLower) {
    return false;
  }

  // data-key 属性。完全一致か、小文字にしての一致
  const { dataKey } = entry;
  if (dataKey && (dataKey === target || dataKey.toLowerCase() === targetLower)) {
    return true;
  }

  // リンクの href。部分一致で、小文字にした比較も行う
  if (
    entry.hrefs?.some(
      (href) => href.includes(target) || href.toLowerCase().includes(targetLower),
    )
  ) {
    return true;
  }

  if (entry.text && entry.text.includes(targetLower)) {
    return true;
  }

  return false;
}

function findCollapseForHiding(container: HTMLElement, el: HTMLElement): HTMLElement | null {
  const isToggle =
    el.getAttribute("data-toggle") === "collapse" ||
    el.getAttribute("data-bs-toggle") === "collapse" ||
    el.hasAttribute("data-target") ||
    el.hasAttribute("data-bs-target") ||
    el.nextElementSibling?.classList.contains("collapse");
  if (!isToggle) {
    return null;
  }

  const targetSelector =
    el.getAttribute("data-target") || el.getAttribute("data-bs-target");
  let collapseEl: HTMLElement | null = null;
  if (targetSelector && targetSelector.startsWith("#")) {
    collapseEl =
      container.querySelector<HTMLElement>(targetSelector) ||
      document.querySelector<HTMLElement>(targetSelector);
  }

  if (!collapseEl && el.nextElementSibling?.classList.contains("collapse")) {
    collapseEl = el.nextElementSibling as HTMLElement;
  }

  if (!collapseEl) {
    const ariaControls = el.getAttribute("aria-controls");
    if (ariaControls) {
      collapseEl = document.getElementById(ariaControls);
    }
  }
  return collapseEl;
}

function hideItem(
  container: HTMLElement,
  topLevelEntries: DrawerEntry[],
  subEntries: DrawerEntry[],
  target: string,
): void {
  for (const entry of topLevelEntries) {
    if (matchesTarget(entry, target)) {
      entry.el.setAttribute("data-mimo-hidden", "true");
      findCollapseForHiding(container, entry.el)?.setAttribute("data-mimo-hidden", "true");
    }
  }

  for (const entry of subEntries) {
    if (matchesTarget(entry, target)) {
      entry.el.setAttribute("data-mimo-hidden", "true");
    }
  }
}

function insertItem(container: HTMLElement, item: NewMenuItem): void {
  const a = document.createElement("a");
  a.className = "list-group-item list-group-item-action";
  a.href = item.href;
  a.textContent = item.text;

  if (item.newTab) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  container.appendChild(a);
}
