// サイト全体で読み込むもの
import "@/assets/global.css";
import { initMenu, initMenuBadges } from "@/features/menu";
import { readCourseList } from "@/moodle/courseList";
import { initIndexToggle } from "@/features/coursePage/indexToggle";
import {
  menuSetting,
  menuBadgesSetting,
  courseListCacheSetting,
} from "@/utils/settings";

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

    const courses = readCourseList();
    if (courses.length > 0) {
      await courseListCacheSetting.setValue({
        courses,
        updatedAt: new Date().toISOString(),
      });
    }

    await initIndexToggle(ctx);
  },
});
