// 時間割設定から学期の実日程（コマごとの授業実施日と回数）を計算する純粋関数群。

import type { PeriodSlot } from "@/utils/periods";
import { formatDateKey, isSameDay } from "./date";
import type {
  TimetableConfig,
  Weekday,
  TimetableSlot,
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
  const day = date.getDay();
  switch (day) {
    case 1:
      return "mon";
    case 2:
      return "tue";
    case 3:
      return "wed";
    case 4:
      return "thu";
    case 5:
      return "fri";
    default:
      return undefined;
  }
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
 */
export function buildSchedule(
  config: TimetableConfig,
  periods: PeriodSlot[],
): LessonOccurrence[] {
  // 有効なコマの総数をチェック
  const weekdays: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];
  const activeSlots: { weekday: Weekday; periodIndex: number; slot: TimetableSlot }[] = [];
  for (const w of weekdays) {
    const list = config.grid[w] || [];
    for (let i = 0; i < Math.max(list.length, periods.length); i++) {
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

  const substituteMap = new Map<string, Weekday>();
  for (const sub of config.substitutes) {
    substituteMap.set(sub.date, sub.weekday);
  }

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
    let targetWeekday: Weekday | undefined;
    if (substituteMap.has(dateKey)) {
      targetWeekday = substituteMap.get(dateKey);
    } else {
      targetWeekday = weekdayOf(currentDate);
    }

    if (targetWeekday) {
      const list = config.grid[targetWeekday] || [];
      for (let i = 0; i < list.length; i++) {
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
 * 指定日のコマ一覧を時限順で返す。
 */
export function lessonsOn(
  date: Date,
  schedule: readonly LessonOccurrence[],
): LessonOccurrence[] {
  return schedule
    .filter((occ) => isSameDay(occ.date, date))
    .sort((a, b) => a.periodIndex - b.periodIndex);
}
