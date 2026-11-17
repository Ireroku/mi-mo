// サイト全体で読み込むもの
import "@/assets/global.css";
import { initMenu, initMenuBadges } from "@/features/menu";
import { readCourseList } from "@/moodle/courseList";
import { readMenuItemNames } from "@/moodle/menuItems";
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
import { isLoggedIn } from "@/moodle/user";
import { initPinnedCourses } from "@/features/ui/quickDrawer";
import { initTimetable } from "@/features/timetable";
import {
  extensionSetting,
  menuSetting,
  menuBadgesSetting,
  courseListCacheSetting,
  menuItemsCacheSetting,
  homeGreetingSetting,
  homeGreetingLastMessage,
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
    // 全体のスイッチが切られている間は、どの機能も動かさない
    if (!(await extensionSetting.getValue()).enabled) {
      return;
    }

    const [
      menuConfig,
      badgesConfig,
      greetingConfig,
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
      uiQuickDrawerSetting.getValue(),
      coursePageAutoattendButtonSetting.getValue(),
      coursePageAutoattendStatsSetting.getValue(),
      coursePageGradeInlineSetting.getValue(),
      coursePageExportSetting.getValue(),
      periodTableSetting.getValue(),
      timetableSetting.getValue(),
      myCoursesTodayOrderSetting.getValue(),
    ]);

    // 未ログインの間は、挨拶と時間割を出さない
    const loggedIn = isLoggedIn();

    // 機能は互いに独立している。1つが失敗しても残りを動かす。
    // 隠す前の項目名を控える。隠した後や、足した項目の入った後では、元の名前がそろわない。
    // 未ログインのメニューは項目が少ないため控えない。名前が前と同じなら書き込まない
    await runFeature("menuItemsCache", async () => {
      if (!loggedIn) {
        return;
      }
      const names = readMenuItemNames();
      const cached = await menuItemsCacheSetting.getValue();
      if (names.length > 0 && names.join("\n") !== cached.names.join("\n")) {
        await menuItemsCacheSetting.setValue({
          names,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    await runFeature("menu", () => initMenu(menuConfig));
    await runFeature("menuBadges", () =>
      initMenuBadges(ctx, badgesConfig, periodTableConfig.periods, timetableConfig),
    );
    await runFeature("loginComponent", () => initLoginComponent());

    if (loggedIn && greetingConfig.enabled) {
      await runFeature("greeting", async () => {
        const shown = await initGreeting(
          ctx,
          greetingConfig,
          await homeGreetingLastMessage.getValue(),
        );
        if (shown !== undefined) {
          await homeGreetingLastMessage.setValue(shown);
        }
      });
    }

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

    if (loggedIn && timetableConfig.enabled) {
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
