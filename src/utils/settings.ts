// 拡張機能の設定を保存・読み出しする。機能ごとに独立したストレージキーを持つ。

import { storage } from "wxt/utils/storage";
import type { HideElementsConfig } from "@/features/home/hideElements";
import type { GreetingConfig } from "@/features/home/greeting";
import type { MenuBadgesConfig } from "@/features/menu";
import type { MenuConfig } from "@/features/menu/navbar/types";
import type { MenuLogoConfig } from "@/features/menu/logo";
import type { FloatingHintConfig } from "@/features/ui/floatingHint";
import type { FontConfig } from "@/features/ui/font";
import type { QuickDrawerConfig } from "@/features/ui/quickDrawer";
import type { LandingPageConfig } from "@/features/ui/landingPage";
import type { ReverseSectionsConfig } from "@/features/coursePage/reverseSections";
import type { AutoattendButtonConfig } from "@/features/coursePage/autoattendButton";
import type { AutoattendStatsConfig } from "@/features/coursePage/autoattendStats";
import type { GradeInlineConfig } from "@/features/coursePage/gradeInline";
import type { ExportConfig } from "@/features/coursePage/exportMarkdown";
import type { CourseRef } from "@/moodle/courseList";
import { migratePeriodsFromV1, type PeriodTableConfig } from "@/utils/periods";
import type { TimetableConfig } from "@/features/timetable/types";
import type { TodayOrderConfig } from "@/features/myCourses/todayOrder";

export interface ExtensionConfig {
  enabled: boolean; // false の間は、設定を残したまま全機能を止める
}

export const extensionSetting = storage.defineItem<ExtensionConfig>(
  "local:extension",
  { fallback: { enabled: true } },
);

export const homeHideElementsSetting = storage.defineItem<HideElementsConfig>(
  "local:home.hideElements",
  {
    fallback: { announcements: true, categories: true, search: true },
  },
);

export const menuSetting = storage.defineItem<MenuConfig>("local:menu.items", {
  fallback: {
    hidden: [
      "Office365",
      "Google",
      "eラーニング",
      "Scilets",
      "三重創生ファンタジスタ",
      "旧Moodle",
    ],
  },
});

export const menuBadgesSetting = storage.defineItem<MenuBadgesConfig>(
  "local:menu.badges",
  {
    fallback: {
      clock: {
        showSeconds: false,
        hour12: false,
        showDate: true,
        showYear: false,
        showWeekday: true,
        showPeriod: true,
      },
      countdowns: [
        {
          id: "next-period",
          label: "次の時限まで",
          source: { kind: "nextPeriod" },
        },
      ],
    },
  },
);

export interface CourseListCache {
  courses: CourseRef[];
  updatedAt: string; // ISO の日時
}

export const courseListCacheSetting = storage.defineItem<CourseListCache>(
  "local:moodle.courseList",
  { fallback: { courses: [], updatedAt: "" } },
);

export interface MenuItemsCache {
  names: string[];
  updatedAt: string; // ISO の日時
}

export const menuItemsCacheSetting = storage.defineItem<MenuItemsCache>(
  "local:moodle.menuItems",
  { fallback: { names: [], updatedAt: "" } },
);

export const menuLogoSetting = storage.defineItem<MenuLogoConfig>(
  "local:menu.logo",
  { fallback: { hidden: false } },
);

export const uiFloatingHintSetting = storage.defineItem<FloatingHintConfig>(
  "local:ui.floatingHint",
  { fallback: { hidden: true } },
);

// 1行目を `{` で終えると、auto-import の走査が fallback のキーを export と取り違える
export const uiFontSetting = storage.defineItem<FontConfig>(
  "local:ui.font",
  { fallback: { enabled: false, family: "", scope: "all" } },
);

export const coursePageReverseSectionsSetting =
  storage.defineItem<ReverseSectionsConfig>(
    "local:coursePage.reverseSections",
    { fallback: { enabled: false } },
  );

export const homeGreetingSetting = storage.defineItem<GreetingConfig>(
  "local:home.greeting",
  {
    fallback: {
      enabled: true,
      salutation: "time",
      messages: [
        "今日も一日、無理せずいきましょう。",
        "あんた、宿題やったの！？",
        "睡眠時間を減らすと効率が落ちるそうですよ。寝ましょう。",
      ],
    },
  },
);

// 直前に出した一言。続けて同じ一言を出さないために覚える
export const homeGreetingLastMessage = storage.defineItem<string>(
  "local:home.greeting.last",
  { fallback: "" },
);

export const uiQuickDrawerSetting = storage.defineItem<QuickDrawerConfig>(
  "local:ui.quickDrawer",
  { fallback: { hidden: false, pinned: [] } },
);

export const uiLandingPageSetting = storage.defineItem<LandingPageConfig>(
  "local:ui.landingPage",
  { fallback: { enabled: false, url: "" } },
);

export const uiLandingPendingFlag = storage.defineItem<boolean>(
  "local:ui.landingPending",
  { fallback: false },
);

export const coursePageAutoattendButtonSetting =
  storage.defineItem<AutoattendButtonConfig>(
    "local:coursePage.autoattendButton",
    { fallback: { enabled: true, placement: "top" } },
  );

export const coursePageAutoattendStatsSetting =
  storage.defineItem<AutoattendStatsConfig>(
    "local:coursePage.autoattendStats",
    { fallback: { enabled: true } },
  );

export const coursePageGradeInlineSetting =
  storage.defineItem<GradeInlineConfig>("local:coursePage.gradeInline", {
    fallback: { enabled: true },
  });

export const coursePageExportSetting = storage.defineItem<ExportConfig>(
  "local:coursePage.export",
  { fallback: { enabled: true, format: "markdown" } },
);

export const periodTableSetting = storage.defineItem<PeriodTableConfig>(
  "local:periods.table",
  {
    fallback: {
      periods: [
        { period: 1, start: "09:00", end: "10:30" },
        { period: 2, start: "10:40", end: "12:10" },
        { period: 3, start: "13:00", end: "14:30" },
        { period: 4, start: "14:40", end: "16:10" },
        { period: 5, start: "16:20", end: "17:50" },
        { period: 6, start: "18:00", end: "19:30" },
      ],
    },
    // 版 2 から、番号は時限を指す変わらない値になり、配列の順が表示の順になった
    version: 2,
    migrations: {
      2: (old: PeriodTableConfig): PeriodTableConfig => ({
        ...old,
        periods: migratePeriodsFromV1(old.periods ?? []),
      }),
    },
  },
);

export const timetableSetting = storage.defineItem<TimetableConfig>(
  "local:home.timetable",
  {
    fallback: {
      enabled: true,
      startDate: "2026-04-06",
      lessonCount: 15,
      grid: {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
      },
      holidays: [],
      substitutes: [],
      color: "moodle",
      syncCountdown: true,
    },
  },
);

export const myCoursesTodayOrderSetting = storage.defineItem<TodayOrderConfig>(
  "local:myCourses.todayOrder",
  { fallback: { enabled: false } },
);
