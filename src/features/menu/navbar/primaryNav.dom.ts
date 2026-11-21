import type { MenuConfig, NewMenuItem } from "./types";
import { NAVBAR_CONTAINER_SELECTOR } from "@/moodle/menuItems";

const HIDDEN_ATTR = "data-mimo-hidden";

/**
 * PC表示のトップバーへ、項目の非表示と追加を適用する。
 */
export function applyNavbarMenu(config: MenuConfig): void {
  const container = document.querySelector<HTMLElement>(NAVBAR_CONTAINER_SELECTOR);
  if (!container) {
    return;
  }

  markHiddenItems(container, config.hidden ?? []);

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

// 隠す対象と照らし合わせ、当たった項目にだけ印を付ける。当たらない項目の印は外す。
// 同じ設定で呼び直しても、属性は書き換わらない
function markHiddenItems(container: HTMLElement, hidden: string[]): void {
  const candidates = [
    ...container.querySelectorAll<HTMLElement>(":scope > li.nav-item"),
    ...container.querySelectorAll<HTMLElement>(".dropdown-menu a.dropdown-item"),
  ];
  for (const el of candidates) {
    const matched = hidden.some((target) => matchesTarget(el, target));
    el.toggleAttribute(HIDDEN_ATTR, matched);
  }
}

// 見張りの間に読む、隠す対象。写しと正本で2回呼ばれるため、後の呼び出しで差し替える
let watchedHidden: string[] = [];
let observer: MutationObserver | null = null;

function markWatched(): void {
  const container = document.querySelector<HTMLElement>(NAVBAR_CONTAINER_SELECTOR);
  if (container) {
    markHiddenItems(container, watchedHidden);
  }
}

function stopWatching(): void {
  observer?.disconnect();
  observer = null;
}

/**
 * document_start から呼ぶ。トップバーの項目が読み込まれるたびに、描画より前に隠す。
 * メニューの後ろ（#usernavigation）が読み込まれるか、DOMContentLoaded で見張りをやめる。
 */
export function watchNavbarHidden(hidden: string[]): void {
  watchedHidden = hidden;
  markWatched();
  if (observer || document.readyState !== "loading") {
    return;
  }

  // 通知はマイクロタスクで届くため、項目が DOM に入った後、描画より前に印が付く
  observer = new MutationObserver(() => {
    markWatched();
    if (document.getElementById("usernavigation")) {
      stopWatching();
    }
  });
  observer.observe(document, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", stopWatching, { once: true });
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
