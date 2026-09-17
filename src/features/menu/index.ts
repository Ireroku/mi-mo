import { MenuManager, type MenuConfig } from "./navbar/menu.manager";

const menuConfig: MenuConfig = {
  hidden: [
    "Office365",
    "Google",
    "eラーニング",
    "Scilets",
    "三重創生ファンタジスタ",
    "旧Moodle",
  ],
};

/**
 * ナビゲーションメニュー機能を初期化する。エントリーポイント（shared.content.ts）から呼び出す。
 */
export function initMenu(): void {
  const menuManager = new MenuManager();
  menuManager.applyConfig(menuConfig);
}
