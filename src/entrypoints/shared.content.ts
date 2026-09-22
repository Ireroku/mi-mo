// サイト全体で読み込むもの
import { initMenu, initMenuBadges } from "@/features/menu";
import { menuSetting, menuBadgesSetting } from "@/utils/settings";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  // clock/countdownバッジのCSSをmanifest経由のグローバル注入ではなくShadow DOM内に閉じ込める
  cssInjectionMode: "ui",

  async main(ctx) {
    const [menuConfig, badgesConfig] = await Promise.all([
      menuSetting.getValue(),
      menuBadgesSetting.getValue(),
    ]);

    initMenu(menuConfig);
    await initMenuBadges(ctx, badgesConfig);
  },
});
