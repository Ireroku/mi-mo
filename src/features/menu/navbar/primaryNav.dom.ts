import type { MenuConfig, NewMenuItem } from "./types";
import { NAVBAR_CONTAINER_SELECTOR } from "@/moodle/menuItems";

/**
 * PC表示のトップバーへ、項目の非表示と追加を適用する。
 */
export function applyNavbarMenu(config: MenuConfig): void {
  const container = document.querySelector<HTMLElement>(NAVBAR_CONTAINER_SELECTOR);
  if (!container) {
    return;
  }

  for (const target of config.hidden ?? []) {
    hideItem(container, target);
  }

  for (const item of config.items ?? []) {
    insertItem(container, item);
  }
}

function matchesTarget(el: HTMLElement, target: string): boolean {
  if (!target) {
    return false;
  }

  const targetLower = target.toLowerCase().trim();

  // data-key 属性。完全一致か、小文字にしての一致
  const dataKey = el.getAttribute("data-key");
  if (dataKey && (dataKey === target || dataKey.toLowerCase() === targetLower)) {
    return true;
  }

  // リンクの href。ドロップダウンを持つ要素は、サブ項目に当たって全体が消えないよう主リンクだけを見る
  const dropdownMenu = el.querySelector(".dropdown-menu");
  const primaryAnchor =
    el instanceof HTMLAnchorElement
      ? el
      : el.querySelector<HTMLAnchorElement>(":scope > a, a.nav-link, a");
  if (
    primaryAnchor &&
    primaryAnchor.href &&
    (primaryAnchor.href.includes(target) ||
      primaryAnchor.href.toLowerCase().includes(targetLower))
  ) {
    return true;
  }

  if (!dropdownMenu) {
    const anchors = el.querySelectorAll<HTMLAnchorElement>("a");
    for (const anchor of anchors) {
      if (
        anchor.href &&
        (anchor.href.includes(target) ||
          anchor.href.toLowerCase().includes(targetLower))
      ) {
        return true;
      }
    }
  }

  // テキスト。ドロップダウンを持つ要素は主リンクのテキストだけを見る
  let text = el.textContent?.trim().toLowerCase();
  if (dropdownMenu && primaryAnchor) {
    text = primaryAnchor.textContent?.trim().toLowerCase();
  }

  if (text && text.includes(targetLower)) {
    return true;
  }

  return false;
}

function hideItem(container: HTMLElement, target: string): void {
  const topLevelItems = container.querySelectorAll<HTMLElement>(":scope > li.nav-item");
  for (const li of topLevelItems) {
    if (matchesTarget(li, target)) {
      li.setAttribute("data-mimo-hidden", "true");
    }
  }

  const dropdownItems = container.querySelectorAll<HTMLElement>(".dropdown-menu a.dropdown-item");
  for (const item of dropdownItems) {
    if (matchesTarget(item, target)) {
      item.setAttribute("data-mimo-hidden", "true");
    }
  }
}

function insertItem(container: HTMLElement, item: NewMenuItem): void {
  const li = document.createElement("li");
  li.className = "nav-item";
  li.setAttribute("role", "none");

  const a = document.createElement("a");
  a.setAttribute("role", "menuitem");
  a.className = "nav-link";
  a.href = item.href;
  a.textContent = item.text;

  if (item.newTab) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  li.appendChild(a);

  // 「さらに」の開閉ボタンより前へ置き、項目の並びの末尾に来るようにする
  const moreMenuEl = container.querySelector<HTMLElement>("li.dropdownmoremenu");
  if (moreMenuEl) {
    container.insertBefore(li, moreMenuEl);
  } else {
    container.appendChild(li);
  }
}
