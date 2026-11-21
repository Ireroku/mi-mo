// 時間割設定から学期の実日程（コマごとの授業実施日と回数）を計算する純粋関数群。

import type { PeriodSlot } from "@/utils/periods";
import { formatDateKey, isSameDay } from "./date";
import {
  WEEKDAYS,
  type TimetableConfig,
  type Weekday,
  type TimetableSlot,
} from "./types";

export interface LessonOccurrence {
  date: Date; // 実際に行う日
  weekday: Weekday; // 行う授業の曜日。振替の日は振替元の曜日
  periodIndex: number; // grid の配列の添字
  slot: TimetableSlot;
  count: number; // このコマにとって何回目か
}

/**
 * Date の曜日を Weekday に変換する。土日なら undefined を返す。
 */
export function weekdayOf(date: Date): Weekday | undefined {
  // 日曜は -1、土曜は 5 になり、どちらも範囲の外で undefined になる
  return WEEKDAYS[date.getDay() - 1];
}

/**
 * 時間割に授業が1つでも入っているかを返す。
 */
export function hasLessons(config: Pick<TimetableConfig, "grid">): boolean {
  return Object.values(config.grid).some((list) => (list ?? []).some(Boolean));
}

// "YYYY-MM-DD" をローカルの0時として読む。形式が合わなければ undefined を返す。
function parseStartDate(dateStr: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    return undefined;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * 時間割設定から学期の実日程を組み立てる。
 * 同じ日の中は時限表の並び順に並べる。時限表に無い番号の授業は含めない。
 */
export function buildSchedule(
  config: TimetableConfig,
  periods: PeriodSlot[],
): LessonOccurrence[] {
  // grid の添字を、時限表の並び順に並べたもの
  const periodIndexes = periods.map((p) => p.period - 1);

  // 有効なコマの総数をチェック
  const activeSlots: { weekday: Weekday; periodIndex: number; slot: TimetableSlot }[] = [];
  for (const w of WEEKDAYS) {
    const list = config.grid[w] || [];
    for (const i of periodIndexes) {
      const slot = list[i];
      if (slot) {
        activeSlots.push({ weekday: w, periodIndex: i, slot });
      }
    }
  }

  const currentDate = parseStartDate(config.startDate);
  if (activeSlots.length === 0 || !currentDate) {
    return [];
  }

  const holidaySet = new Set(config.holidays.map((h) => h.date));

  const substituteMap = new Map(config.substitutes.map((sub) => [sub.date, sub.weekday]));

  const occurrences: LessonOccurrence[] = [];
  const countMap = new Map<string, number>();
  const isCompleted = () => {
    return activeSlots.every((s) => {
      const key = `${s.weekday}-${s.periodIndex}`;
      return (countMap.get(key) ?? 0) >= config.lessonCount;
    });
  };

  for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
    if (isCompleted()) {
      break;
    }

    const dateKey = formatDateKey(currentDate);
    // 休講日チェック（休講が振替より優先）
    if (holidaySet.has(dateKey)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // 行う授業の曜日（振替があれば振替元の曜日、なければ実際の曜日）
    const targetWeekday = substituteMap.get(dateKey) ?? weekdayOf(currentDate);

    if (targetWeekday) {
      const list = config.grid[targetWeekday] || [];
      for (const i of periodIndexes) {
        const slot = list[i];
        if (!slot) {
          continue;
        }

        const slotKey = `${targetWeekday}-${i}`;
        const currentCount = countMap.get(slotKey) ?? 0;
        if (currentCount < config.lessonCount) {
          const nextCount = currentCount + 1;
          countMap.set(slotKey, nextCount);

          occurrences.push({
            date: new Date(currentDate),
            weekday: targetWeekday,
            periodIndex: i,
            slot,
            count: nextCount,
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return occurrences;
}

/**
 * 指定日のコマ一覧を返す。buildSchedule が日の中を時限表の並び順に並べるため、その順を保つ。
 */
export function lessonsOn(
  date: Date,
  schedule: readonly LessonOccurrence[],
): LessonOccurrence[] {
  return schedule.filter((occ) => isSameDay(occ.date, date));
}
