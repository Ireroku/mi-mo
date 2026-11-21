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
    const [
      extension,
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
      menuItemsCache,
      greetingLastMessage,
      courseListCache,
    ] = await Promise.all([
      extensionSetting.getValue(),
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
      menuItemsCacheSetting.getValue(),
      homeGreetingLastMessage.getValue(),
      courseListCacheSetting.getValue(),
    ]);

    // 全体のスイッチが切られている間は、どの機能も動かさない
    if (!extension.enabled) {
      return;
    }

    // 未ログインの間は、挨拶と時間割を出さない
    const loggedIn = isLoggedIn();

    // 機能は互いに独立している。1つが失敗しても残りを動かす。
    // 待ち合わせずに並べて始め、最後にまとめて待つ。
    // 成績の取得などを待つ機能が、他の機能の表示を遅らせないため
    const features: Promise<void>[] = [];

    // 隠す前の項目名を控える。隠した後や、足した項目の入った後では、元の名前がそろわない。
    // 名前を読む所は最初の await より前にあり、initMenu より先に終わる。
    // 未ログインのメニューは項目が少ないため控えない。名前が前と同じなら書き込まない
    features.push(
      runFeature("menuItemsCache", async () => {
        if (!loggedIn) {
          return;
        }
        const names = readMenuItemNames();
        if (
          names.length > 0 &&
          names.join("\n") !== menuItemsCache.names.join("\n")
        ) {
          await menuItemsCacheSetting.setValue({
            names,
            updatedAt: new Date().toISOString(),
          });
        }
      }),
    );
    features.push(runFeature("menu", () => initMenu(menuConfig)));
    features.push(
      runFeature("menuBadges", () =>
        initMenuBadges(
          ctx,
          badgesConfig,
          periodTableConfig.periods,
          timetableConfig,
          !quickDrawerConfig.hidden,
        ),
      ),
    );
    features.push(runFeature("loginComponent", () => initLoginComponent()));

    // 挨拶と時間割は同じ入れ物の末尾へ足す。挨拶を上に置くため、時間割は挨拶の後に始める
    if (loggedIn) {
      features.push(
        (async () => {
          if (greetingConfig.enabled) {
            await runFeature("greeting", async () => {
              const shown = await initGreeting(ctx, greetingConfig, greetingLastMessage);
              if (shown !== undefined) {
                await homeGreetingLastMessage.setValue(shown);
              }
            });
          }
          if (timetableConfig.enabled) {
            await runFeature("timetable", () =>
              initTimetable(ctx, timetableConfig, periodTableConfig.periods),
            );
          }
        })(),
      );
    }

    if (!quickDrawerConfig.hidden && quickDrawerConfig.pinned.length > 0) {
      features.push(
        runFeature("pinnedCourses", () => initPinnedCourses(ctx, quickDrawerConfig)),
      );
    }

    // メニューの項目名と同じく、一覧が前と同じなら書き込まない
    features.push(
      runFeature("courseListCache", async () => {
        const courses = readCourseList();
        if (
          courses.length > 0 &&
          JSON.stringify(courses) !== JSON.stringify(courseListCache.courses)
        ) {
          await courseListCacheSetting.setValue({
            courses,
            updatedAt: new Date().toISOString(),
          });
        }
      }),
    );

    features.push(runFeature("indexToggle", () => initIndexToggle(ctx)));
    features.push(runFeature("incrementalSearch", () => initIncrementalSearch(ctx)));

    if (autoattendButtonConfig.enabled) {
      features.push(
        runFeature("autoattendButton", () =>
          initAutoattendButton(ctx, autoattendButtonConfig),
        ),
      );
    }

    if (autoattendStatsConfig.enabled) {
      features.push(
        runFeature("autoattendStats", () =>
          initAutoattendStats(ctx, autoattendStatsConfig),
        ),
      );
    }

    if (gradeInlineConfig.enabled) {
      features.push(runFeature("gradeInline", () => initGradeInline(gradeInlineConfig)));
    }

    if (exportConfig.enabled) {
      features.push(runFeature("exportMarkdown", () => initExportMarkdown(exportConfig)));
    }

    features.push(runFeature("bulkDownload", () => initBulkDownload()));

    if (todayOrderConfig.enabled) {
      features.push(
        runFeature("todayOrder", () =>
          initTodayOrder(ctx, todayOrderConfig, timetableConfig, periodTableConfig.periods),
        ),
      );
    }

    await Promise.all(features);
  },
});
