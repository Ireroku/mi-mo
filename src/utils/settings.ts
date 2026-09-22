// 拡張機能の設定を保存・読み出しする。機能ごとに独立したストレージキーを持つ。

import { storage } from "wxt/utils/storage";
import type { HideElementsConfig } from "@/features/home/hideElements";
import type { MenuBadgesConfig } from "@/features/menu";
import type { MenuConfig } from "@/features/menu/navbar/types";
import type { MenuLogoConfig } from "@/features/menu/logo";
import type { FloatingHintConfig } from "@/features/ui/floatingHint";
import type { CourseRef } from "@/moodle/courseList";

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
        showSeconds: true,
        showDate: true,
        showWeekday: true,
        showPeriod: true,
      },
      periods: [
        { period: 1, start: "09:00", end: "10:30" },
        { period: 2, start: "10:40", end: "12:10" },
        { period: 3, start: "13:00", end: "14:30" },
        { period: 4, start: "14:40", end: "16:10" },
        { period: 5, start: "16:20", end: "17:50" },
        { period: 6, start: "18:00", end: "19:30" },
      ],
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

export const menuLogoSetting = storage.defineItem<MenuLogoConfig>(
  "local:menu.logo",
  { fallback: { hidden: false } },
);

export const uiFloatingHintSetting = storage.defineItem<FloatingHintConfig>(
  "local:ui.floatingHint",
  { fallback: { hidden: true } },
);
