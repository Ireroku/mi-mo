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
import { initTodayOrder } from "@/features/myCourses/todayOrder";
import { initLoginComponent } from "@/features/home/loginComponent";
import { initGreeting } from "@/features/home/greeting";
import { advanceRecord, initLastAccess } from "@/features/home/lastAccess";
import { initPinnedCourses } from "@/features/ui/quickDrawer";
import { initTimetable } from "@/features/timetable";
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
  periodTableSetting,
  timetableSetting,
  myCoursesTodayOrderSetting,
} from "@/utils/settings";
import { runFeature } from "@/utils/runFeature";

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
      periodTableConfig,
      timetableConfig,
      todayOrderConfig,
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
      periodTableSetting.getValue(),
      timetableSetting.getValue(),
      myCoursesTodayOrderSetting.getValue(),
    ]);

    // 機能は互いに独立している。1つが失敗しても残りを動かす。
    await runFeature("menu", () => initMenu(menuConfig));
    await runFeature("menuBadges", () =>
      initMenuBadges(ctx, badgesConfig, periodTableConfig.periods),
    );
    await runFeature("loginComponent", () => initLoginComponent());

    if (greetingConfig.enabled) {
      await runFeature("greeting", () => initGreeting(ctx, greetingConfig));
    }

    await runFeature("lastAccess", async () => {
      await initLastAccess(ctx, lastAccessRecord);
      await homeLastAccessRecord.setValue(
        advanceRecord(lastAccessRecord, new Date()),
      );
    });

    if (!quickDrawerConfig.hidden && quickDrawerConfig.pinned.length > 0) {
      await runFeature("pinnedCourses", () =>
        initPinnedCourses(ctx, quickDrawerConfig),
      );
    }

    await runFeature("courseListCache", async () => {
      const courses = readCourseList();
      if (courses.length > 0) {
        await courseListCacheSetting.setValue({
          courses,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    await runFeature("indexToggle", () => initIndexToggle(ctx));
    await runFeature("incrementalSearch", () => initIncrementalSearch(ctx));

    if (autoattendButtonConfig.enabled) {
      await runFeature("autoattendButton", () =>
        initAutoattendButton(ctx, autoattendButtonConfig),
      );
    }

    if (autoattendStatsConfig.enabled) {
      await runFeature("autoattendStats", () =>
        initAutoattendStats(ctx, autoattendStatsConfig),
      );
    }

    if (gradeInlineConfig.enabled) {
      await runFeature("gradeInline", () => initGradeInline(gradeInlineConfig));
    }

    if (exportConfig.enabled) {
      await runFeature("exportMarkdown", () => initExportMarkdown(exportConfig));
    }

    await runFeature("bulkDownload", () => initBulkDownload());

    if (timetableConfig.enabled) {
      await runFeature("timetable", () =>
        initTimetable(ctx, timetableConfig, periodTableConfig.periods),
      );
    }

    if (todayOrderConfig.enabled) {
      await runFeature("todayOrder", () =>
        initTodayOrder(ctx, todayOrderConfig, timetableConfig, periodTableConfig.periods),
      );
    }
  },
});
