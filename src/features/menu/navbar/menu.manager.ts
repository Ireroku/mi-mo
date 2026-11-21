import type { MenuConfig } from "./types";
import { applyNavbarMenu } from "./primaryNav.dom";
import { applyDrawerMenu } from "./drawer.dom";
import { applyStyleSheet } from "@/utils/styleSheet";

/**
 * メニューの設定を、PC表示のトップバーとモバイル表示のドロワーの両方へ適用する。
 */
export function applyMenuConfig(config: MenuConfig): void {
  applyStyleSheet(
    "mimo-menu-style",
    "[data-mimo-hidden] { display: none !important; }",
  );

  applyNavbarMenu(config);
  applyDrawerMenu(config);
}
