import type { MenuConfig } from "./types";
import { applyNavbarMenu, watchNavbarHidden } from "./primaryNav.dom";
import { applyDrawerMenu } from "./drawer.dom";
import { applyStyleSheet } from "@/utils/styleSheet";

function applyHiddenStyle(): void {
  applyStyleSheet(
    "mimo-menu-style",
    "[data-mimo-hidden] { display: none !important; }",
  );
}

/**
 * メニューの設定を、PC表示のトップバーとモバイル表示のドロワーの両方へ適用する。
 */
export function applyMenuConfig(config: MenuConfig): void {
  applyHiddenStyle();
  applyNavbarMenu(config);
  applyDrawerMenu(config);
}

/**
 * document_start から呼ぶ。PC表示のトップバーの項目を、読み込まれた時点で隠す。
 * ドロワーと項目の追加は applyMenuConfig に任せる。
 */
export function hideNavbarItemsEarly(config: Pick<MenuConfig, "hidden">): void {
  applyHiddenStyle();
  watchNavbarHidden(config.hidden ?? []);
}
