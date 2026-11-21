// 拡張機能の設定を保存・読み出しする。機能ごとに独立したストレージキーを持つ。

import {
  storage,
  type StorageItemKey,
  type WxtStorageItem,
  type WxtStorageItemOptions,
} from "wxt/utils/storage";
import { fillDefaults } from "@/utils/fillDefaults";
import type { HideElementsConfig } from "@/features/home/hideElements";
import type { GreetingConfig } from "@/features/home/greeting";
import type { MenuBadgesConfig } from "@/features/menu";
import type { MenuConfig } from "@/features/menu/navbar/types";
import type { MenuLogoConfig } from "@/features/menu/logo";
import type { FloatingHintConfig } from "@/features/ui/floatingHint";
import type { FontConfig } from "@/features/ui/font";
import type { QuickDrawerConfig } from "@/features/ui/quickDrawer";
import type { LandingPageConfig } from "@/features/ui/landingPage.logic";
import type { ReverseSectionsConfig } from "@/features/coursePage/reverseSections";
import type { AutoattendButtonConfig } from "@/features/coursePage/autoattendButton";
import type { AutoattendStatsConfig } from "@/features/coursePage/autoattendStats";
import type { GradeInlineConfig } from "@/features/coursePage/gradeInline";
import type { ExportConfig } from "@/features/coursePage/exportMarkdown";
import type { CourseRef } from "@/moodle/courseList";
import { migratePeriodsFromV1, type PeriodTableConfig } from "@/utils/periods";
import type { TimetableConfig } from "@/features/timetable/types";
import type { TodayOrderConfig } from "@/features/myCourses/todayOrder";

// storage.defineItem と同じ項目を作る。読み出す値に欠けたキーがあれば fallback から補う。
// 保存済みの値は書き換えず、読むたびに補う
function defineSetting<T>(
  key: StorageItemKey,
  options: WxtStorageItemOptions<T> & { fallback: T },
): WxtStorageItem<T, Record<string, never>> {
  const item = storage.defineItem<T, Record<string, never>>(key, options);
  const fill = (value: T) => fillDefaults(value, options.fallback);
  return {
    ...item,
    getValue: async () => fill(await item.getValue()),
    watch: (cb) => item.watch((next, prev) => cb(fill(next), fill(prev))),
  };
}

export interface ExtensionConfig {
  enabled: boolean; // false の間は、設定を残したまま全機能を止める
}

export const extensionSetting = defineSetting<ExtensionConfig>(
  "local:extension",
  { fallback: { enabled: true } },
);

export const homeHideElementsSetting = defineSetting<HideElementsConfig>(
  "local:home.hideElements",
  {
    fallback: { announcements: true, categories: true, search: true },
  },
);

export const menuSetting = defineSetting<MenuConfig>(
  "local:menu.items",
  {
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
  },
);

export const menuBadgesSetting = defineSetting<MenuBadgesConfig>(
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
      thresholds: {
        secondsWithinMinutes: 15,
        minutesWithinHours: 24,
        hoursWithinDays: 7,
      },
    },
  },
);

export interface CourseListCache {
  courses: CourseRef[];
  updatedAt: string; // ISO の日時
}

export const courseListCacheSetting = defineSetting<CourseListCache>(
  "local:moodle.courseList",
  { fallback: { courses: [], updatedAt: "" } },
);

export interface MenuItemsCache {
  names: string[];
  updatedAt: string; // ISO の日時
}

export const menuItemsCacheSetting = defineSetting<MenuItemsCache>(
  "local:moodle.menuItems",
  { fallback: { names: [], updatedAt: "" } },
);

export const menuLogoSetting = defineSetting<MenuLogoConfig>(
  "local:menu.logo",
  { fallback: { hidden: false } },
);

export const uiFloatingHintSetting = defineSetting<FloatingHintConfig>(
  "local:ui.floatingHint",
  { fallback: { hidden: true } },
);

// 1行目を `{` で終えると、auto-import の走査が fallback のキーを export と取り違える
export const uiFontSetting = defineSetting<FontConfig>(
  "local:ui.font",
  { fallback: { enabled: false, family: "", scope: "all" } },
);

export const coursePageReverseSectionsSetting =
  defineSetting<ReverseSectionsConfig>(
    "local:coursePage.reverseSections",
    { fallback: { enabled: false } },
  );

export const homeGreetingSetting = defineSetting<GreetingConfig>(
  "local:home.greeting",
  {
    fallback: {
      enabled: true,
      salutation: "time",
      useDefaultMessages: true,
      messages: [],
    },
  },
);

// 直前に出した一言。続けて同じ一言を出さないために覚える
export const homeGreetingLastMessage = defineSetting<string>(
  "local:home.greeting.last",
  { fallback: "" },
);

export const uiQuickDrawerSetting = defineSetting<QuickDrawerConfig>(
  "local:ui.quickDrawer",
  { fallback: { hidden: false, pinned: [] } },
);

export const uiLandingPageSetting = defineSetting<LandingPageConfig>(
  "local:ui.landingPage",
  {
    fallback: {
      enabled: true,
      url: "https://lms-m41.mie-u.ac.jp/my/courses.php",
    },
  },
);

export const uiLandingPendingFlag = defineSetting<boolean>(
  "local:ui.landingPending",
  { fallback: false },
);

export const coursePageAutoattendButtonSetting =
  defineSetting<AutoattendButtonConfig>(
    "local:coursePage.autoattendButton",
    { fallback: { enabled: true, placement: "top" } },
  );

export const coursePageAutoattendStatsSetting =
  defineSetting<AutoattendStatsConfig>(
    "local:coursePage.autoattendStats",
    { fallback: { enabled: true } },
  );

export const coursePageGradeInlineSetting =
  defineSetting<GradeInlineConfig>(
    "local:coursePage.gradeInline",
    { fallback: { enabled: true } },
  );

export const coursePageExportSetting = defineSetting<ExportConfig>(
  "local:coursePage.export",
  { fallback: { enabled: true, format: "markdown" } },
);

export const periodTableSetting = defineSetting<PeriodTableConfig>(
  "local:periods.table",
  {
    fallback: {
      periods: [
        { period: 1, start: "08:50", end: "10:20" },
        { period: 2, start: "10:30", end: "12:00" },
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

export const timetableSetting = defineSetting<TimetableConfig>(
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

export const myCoursesTodayOrderSetting = defineSetting<TodayOrderConfig>(
  "local:myCourses.todayOrder",
  { fallback: { enabled: false } },
);
