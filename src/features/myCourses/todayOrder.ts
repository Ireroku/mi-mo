// マイコース一覧を、時間割設定に基づく「今日の授業順」で並べ替える。

import { isMyCourses } from "@/moodle/page";
import type { PeriodSlot } from "@/utils/periods";
import type { TimetableConfig } from "@/features/timetable/types";
import { buildSchedule, lessonsOn } from "@/features/timetable/schedule.logic";

export interface TodayOrderConfig {
  enabled: boolean;
}

function parseCourseIdFromUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr, "https://dummy.example");
    return url.searchParams.get("id");
  } catch {
    return null;
  }
}

/**
 * マイコース一覧の並べ替えを初期化する。
 */
export function initTodayOrder(
  config: TodayOrderConfig,
  timetable: TimetableConfig,
  periods: PeriodSlot[],
): void {
  if (!config.enabled || !isMyCourses()) return;

  const today = new Date();
  const schedule = buildSchedule(timetable, periods);
  const todayLessons = lessonsOn(today, schedule);

  const todayCourseIds: string[] = [];
  for (const occ of todayLessons) {
    if (!occ.slot.url) continue;
    const id = parseCourseIdFromUrl(occ.slot.url);
    if (id && !todayCourseIds.includes(id)) {
      todayCourseIds.push(id);
    }
  }

  // 今日の授業が1つもなければ並べ替え不要
  if (todayCourseIds.length === 0) return;

  let isReordering = false;

  const reorderCourses = () => {
    if (isReordering) return;
    isReordering = true;

    try {
      const courseElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.block-myoverview [data-region="course-content"]',
        ),
      );
      if (courseElements.length === 0) return;

      // 各要素のラップ要素（カード表示時の .col または要素自身）とコースIDの組を作る
      const items: { wrapper: HTMLElement; courseId: string }[] = [];
      const parent = (courseElements[0]?.closest(".col") ?? courseElements[0])?.parentElement;
      if (!parent) return;

      for (const el of courseElements) {
        const courseId = el.getAttribute("data-course-id") || "";
        const wrapper = (el.closest(".col") as HTMLElement | null) ?? el;
        items.push({ wrapper, courseId });
      }

      // 今日の授業順に含まれるものを前へ、それ以外は元の順序を保つ
      const prioritized: HTMLElement[] = [];
      const others: HTMLElement[] = [];

      // 今日の授業順に並べる
      for (const id of todayCourseIds) {
        const found = items.find((it) => it.courseId === id);
        if (found) {
          prioritized.push(found.wrapper);
        }
      }

      // 今日の授業順に含まれないもの
      for (const it of items) {
        if (!prioritized.includes(it.wrapper)) {
          others.push(it.wrapper);
        }
      }

      const newOrder = [...prioritized, ...others];

      // 親要素の末尾へ順に再配置
      for (const node of newOrder) {
        parent.appendChild(node);
      }
    } finally {
      isReordering = false;
    }
  };

  // 初回実行
  reorderCourses();

  // 非同期読み込み・再描画への追従
  const overviewBlock = document.querySelector(".block-myoverview");
  if (overviewBlock) {
    const observer = new MutationObserver(() => {
      if (!isReordering) {
        reorderCourses();
      }
    });

    observer.observe(overviewBlock, {
      childList: true,
      subtree: true,
    });
  }
}
