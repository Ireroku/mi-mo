// ホームへ差し込む要素（挨拶・最終アクセス・時間割）をまとめて入れる器を用意する。
// それぞれが直接 Moodle の DOM へ割り込まず、この器の中へ順に並べる。

import { isSiteHome, isDashboard } from "@/moodle/page";

export const HOME_CONTAINER_ID = "mimo-home-top";

/**
 * ホームへ差し込む要素の器を用意する。
 * サイトホーム: #region-main div.course-content の直前
 * ダッシュボード: #block-region-content の先頭
 */
export function ensureHomeContainer(): HTMLElement | undefined {
  const existing = document.getElementById(HOME_CONTAINER_ID);
  if (existing) {
    return existing;
  }

  let container: HTMLDivElement | undefined;
  if (isSiteHome()) {
    const target = document.querySelector("#region-main div.course-content");
    if (!target || !target.parentElement) {
      return undefined;
    }

    container = document.createElement("div");
    container.id = HOME_CONTAINER_ID;
    target.parentElement.insertBefore(container, target);
  } else if (isDashboard()) {
    const target = document.querySelector("#block-region-content");
    if (!target) {
      return undefined;
    }

    container = document.createElement("div");
    container.id = HOME_CONTAINER_ID;
    target.prepend(container);
  }

  return container;
}
