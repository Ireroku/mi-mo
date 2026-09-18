// サイト全体で読み込むもの
import { initMenu, initMenuBadges } from "@/features/menu";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  // clock/countdownバッジのCSSをmanifest経由のグローバル注入ではなくShadow DOM内に閉じ込める
  cssInjectionMode: "ui",

  async main(ctx) {
    initMenu();
    await initMenuBadges(ctx);
  },
});
