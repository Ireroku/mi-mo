// サイト全体で読み込むもの
import "@/assets/global.css";
import { initMenu, initMenuBadges } from "@/features/menu";
import { readCourseList } from "@/moodle/courseList";
import { initIndexToggle } from "@/features/coursePage/indexToggle";
import { initIncrementalSearch } from "@/features/myCourses/incrementalSearch";
import { initLoginComponent } from "@/features/home/loginComponent";
import { initGreeting } from "@/features/home/greeting";
import { advanceRecord, initLastAccess } from "@/features/home/lastAccess";
import {
  menuSetting,
  menuBadgesSetting,
  courseListCacheSetting,
  homeGreetingSetting,
  homeLastAccessRecord,
} from "@/utils/settings";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  // clock/countdownバッジのCSSをmanifest経由のグローバル注入ではなくShadow DOM内に閉じ込める
  cssInjectionMode: "ui",

  async main(ctx) {
    const [menuConfig, badgesConfig, greetingConfig, lastAccessRecord] =
      await Promise.all([
        menuSetting.getValue(),
        menuBadgesSetting.getValue(),
        homeGreetingSetting.getValue(),
        homeLastAccessRecord.getValue(),
      ]);

    initMenu(menuConfig);
    await initMenuBadges(ctx, badgesConfig);

    initLoginComponent();

    if (greetingConfig.enabled) {
      await initGreeting(ctx, greetingConfig);
    }

    await initLastAccess(ctx, lastAccessRecord);
    await homeLastAccessRecord.setValue(
      advanceRecord(lastAccessRecord, new Date()),
    );

    const courses = readCourseList();
    if (courses.length > 0) {
      await courseListCacheSetting.setValue({
        courses,
        updatedAt: new Date().toISOString(),
      });
    }

    await initIndexToggle(ctx);
    initIncrementalSearch();
  },
});
