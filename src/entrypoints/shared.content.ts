// サイト全体で読み込むもの
import "@/assets/global.css";
import { initMenu, initMenuBadges } from "@/features/menu";
import { readCourseList } from "@/moodle/courseList";
import { initIndexToggle } from "@/features/coursePage/indexToggle";
import { initAutoattendButton } from "@/features/coursePage/autoattendButton";
import { initAutoattendStats } from "@/features/coursePage/autoattendStats";
import { initGradeInline } from "@/features/coursePage/gradeInline";
import { initExportMarkdown } from "@/features/coursePage/exportMarkdown";
import { initBulkDownload } from "@/features/coursePage/bulkDownload";
import { initIncrementalSearch } from "@/features/myCourses/incrementalSearch";
import { initLoginComponent } from "@/features/home/loginComponent";
import { initGreeting } from "@/features/home/greeting";
import { advanceRecord, initLastAccess } from "@/features/home/lastAccess";
import { initPinnedCourses } from "@/features/ui/quickDrawer";
import {
  menuSetting,
  menuBadgesSetting,
  courseListCacheSetting,
  homeGreetingSetting,
  homeLastAccessRecord,
  uiQuickDrawerSetting,
  coursePageAutoattendButtonSetting,
  coursePageAutoattendStatsSetting,
  coursePageGradeInlineSetting,
  coursePageExportSetting,
} from "@/utils/settings";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  // clock/countdownバッジのCSSをmanifest経由のグローバル注入ではなくShadow DOM内に閉じ込める
  cssInjectionMode: "ui",

  async main(ctx) {
    const [
      menuConfig,
      badgesConfig,
      greetingConfig,
      lastAccessRecord,
      quickDrawerConfig,
      autoattendButtonConfig,
      autoattendStatsConfig,
      gradeInlineConfig,
      exportConfig,
    ] = await Promise.all([
      menuSetting.getValue(),
      menuBadgesSetting.getValue(),
      homeGreetingSetting.getValue(),
      homeLastAccessRecord.getValue(),
      uiQuickDrawerSetting.getValue(),
      coursePageAutoattendButtonSetting.getValue(),
      coursePageAutoattendStatsSetting.getValue(),
      coursePageGradeInlineSetting.getValue(),
      coursePageExportSetting.getValue(),
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

    if (!quickDrawerConfig.hidden && quickDrawerConfig.pinned.length > 0) {
      await initPinnedCourses(ctx, quickDrawerConfig);
    }

    const courses = readCourseList();
    if (courses.length > 0) {
      await courseListCacheSetting.setValue({
        courses,
        updatedAt: new Date().toISOString(),
      });
    }

    await initIndexToggle(ctx);
    initIncrementalSearch();

    if (autoattendButtonConfig.enabled) {
      await initAutoattendButton(ctx, autoattendButtonConfig);
    }

    if (autoattendStatsConfig.enabled) {
      await initAutoattendStats(ctx, autoattendStatsConfig);
    }

    if (gradeInlineConfig.enabled) {
      await initGradeInline(gradeInlineConfig);
    }

    if (exportConfig.enabled) {
      initExportMarkdown(exportConfig);
    }

    initBulkDownload();
  },
});
