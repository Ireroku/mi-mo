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

interface CourseItem {
  wrapper: HTMLElement;
  courseId: string;
}

function collectCourseItems(): CourseItem[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '.block-myoverview [data-region="course-content"]',
    ),
    (element) => ({
      wrapper: element.closest<HTMLElement>(".col") ?? element,
      courseId: element.getAttribute("data-course-id") || "",
    }),
  );
}

function orderCourseItems(items: CourseItem[], todayCourseIds: string[]): HTMLElement[] {
  const prioritized: HTMLElement[] = [];
  for (const id of todayCourseIds) {
    const found = items.find((item) => item.courseId === id);
    if (found) {
      prioritized.push(found.wrapper);
    }
  }

  const others = items
    .filter((item) => !prioritized.includes(item.wrapper))
    .map((item) => item.wrapper);
  return [...prioritized, ...others];
}

/**
 * マイコース一覧の並べ替えを初期化する。
 */
export function initTodayOrder(
  config: TodayOrderConfig,
  timetable: TimetableConfig,
  periods: PeriodSlot[],
): void {
  if (!config.enabled || !isMyCourses()) {
    return;
  }

  const today = new Date();
  const schedule = buildSchedule(timetable, periods);
  const todayLessons = lessonsOn(today, schedule);

  const todayCourseIds: string[] = [];
  for (const lesson of todayLessons) {
    if (!lesson.slot.url) {
      continue;
    }

    const id = parseCourseIdFromUrl(lesson.slot.url);
    if (id && !todayCourseIds.includes(id)) {
      todayCourseIds.push(id);
    }
  }

  // 今日の授業が1つもなければ並べ替え不要
  if (todayCourseIds.length === 0) {
    return;
  }

  const reorderCourses = () => {
    const items = collectCourseItems();
    const parent = items[0]?.wrapper.parentElement;
    if (!parent) {
      return;
    }

    const newOrder = orderCourseItems(items, todayCourseIds);
    // 自分のDOM変更も非同期で通知される。同じ順序なら変更せず監視を収束させる。
    if (newOrder.every((node, index) => node === items[index]?.wrapper)) {
      return;
    }

    for (const node of newOrder) {
      parent.appendChild(node);
    }
  };

  // 初回実行
  reorderCourses();

  // 非同期読み込み・再描画への追従
  const overviewBlock = document.querySelector(".block-myoverview");
  if (overviewBlock) {
    const observer = new MutationObserver(() => {
      reorderCourses();
    });

    observer.observe(overviewBlock, {
      childList: true,
      subtree: true,
    });
  }
}
