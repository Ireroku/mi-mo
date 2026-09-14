import { MenuManager, type MenuConfig } from "./menu/menu";

export default defineContentScript({
  // Set manifest options
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  // world: undefined | 'ISOLATED' | 'MAIN',

  // Configure how CSS is injected onto the page
  // cssInjectionMode: undefined | "manifest" | "manual" | "ui",

  main(ctx) {
    // ナビゲーションメニューの処理
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
    const menuManager = new MenuManager();
    menuManager.applyConfig(menuConfig);
  },
});
