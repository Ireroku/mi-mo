import { ELLIPSIS, chunkGraphemes, splitGraphemes } from "@/utils/graphemes";
import { findPeriodSegment, periodName, type PeriodSlot } from "@/utils/periods";
import {
  lessonsOn,
  type LessonOccurrence,
} from "@/features/timetable/schedule.logic";

// ある時点で出す中身。counting はラベルと数える先、classesOver はその日の授業が終わったこと
export type CountdownState =
  | { kind: "counting"; label: string; target: Date }
  | { kind: "classesOver" };

export interface CountdownTarget {
  id: string;
  resolve: (now: Date) => CountdownState;
}

export type CountdownSource =
  | { kind: "nextPeriod" }
  | { kind: "fixedDate"; at: string };

export interface CountdownConfig {
  id: string;
  label: string;
  source: CountdownSource;
}

export const COUNTDOWN_ENDED_LABEL = "終了しました";
export const CLASSES_OVER_LABEL = "授業終了";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const FIFTEEN_MINUTES_MS = 15 * MINUTE_MS;
const SEVEN_DAYS_MS = 7 * DAY_MS;

/**
 * 残りmsを4段階の粒度（境界はすべて「以内」＝その値を含む）で整形する純粋関数。
 * - 15分以内: 秒
 * - 24時間以内: 分
 * - 7日以内: 日+時間
 * - それ以上: 日数のみ
 */
export function formatRemaining(remainingMs: number): string {
  if (remainingMs <= 0) {
    return COUNTDOWN_ENDED_LABEL;
  }

  if (remainingMs <= FIFTEEN_MINUTES_MS) {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
  }

  if (remainingMs <= DAY_MS) {
    const totalMinutes = Math.floor(remainingMs / MINUTE_MS);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
  }

  if (remainingMs <= SEVEN_DAYS_MS) {
    const totalHours = Math.floor(remainingMs / HOUR_MS);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return hours > 0 ? `${days}日と${hours}時間` : `${days}日`;
  }

  const days = Math.floor(remainingMs / DAY_MS);
  return `${days}日`;
}

/**
 * 時限の区切りまでのカウントダウンの中身を返す。
 * 時限の最中はその終了（「五限 終了まで」）、時限の前は次の時限の開始（「六限 まで」）を数える。
 * その日に残りの時限が無ければ classesOver を返し、翌日へは回さない。
 * schedule を渡すと、その日に授業のある時限だけを数える。sortedPeriods はソート済みの表を前提とする。
 */
export function resolvePeriodCountdown(
  now: Date,
  sortedPeriods: readonly PeriodSlot[],
  schedule?: readonly LessonOccurrence[],
): CountdownState {
  let periods = sortedPeriods;
  if (schedule) {
    // 授業の periodIndex は、時限の番号 - 1
    const today = new Set(lessonsOn(now, schedule).map((lesson) => lesson.periodIndex + 1));
    periods = sortedPeriods.filter((slot) => today.has(slot.period));
  }

  const segment = findPeriodSegment(now, periods);
  if (!segment) {
    return { kind: "classesOver" };
  }

  const name = periodName(segment.slot);
  return {
    kind: "counting",
    label: segment.phase === "during" ? `${name} 終了まで` : `${name} まで`,
    target: segment.at,
  };
}

/**
 * 保存できる形の CountdownConfig[] を、実行時の CountdownTarget[] へ変換する。
 * sortedPeriods はソート済みであることを前提とする（findPeriodSegment の要件を引き継ぐ）。
 * schedule は時間割に合わせる時にだけ渡す。
 * 日時が空か読めない対象は、書きかけの行として飛ばす。
 */
export function buildCountdownTargets(
  configs: CountdownConfig[],
  sortedPeriods: PeriodSlot[],
  schedule?: readonly LessonOccurrence[],
): CountdownTarget[] {
  return configs.flatMap(({ id, label, source }): CountdownTarget[] => {
    switch (source.kind) {
      case "nextPeriod":
        // ラベルは区切りに合わせて作り、保存されたラベルは使わない
        return [
          {
            id,
            resolve: (now) => resolvePeriodCountdown(now, sortedPeriods, schedule),
          },
        ];
      case "fixedDate": {
        const target = new Date(source.at);
        if (Number.isNaN(target.getTime())) {
          return [];
        }
        return [{ id, resolve: () => ({ kind: "counting", label, target }) }];
      }
    }
  });
}

export const LABEL_CHARS_PER_LINE = 4;
export const LABEL_MAX_LINES = 2;

/**
 * ラベルを表示する行に分ける。空白があればそこで改行し、各語を perLine 文字ごとに折る。
 * maxLines を超える分は捨て、最終行の末尾を「…」にする。
 * 文字は書記素（見た目の1文字）で数え、結合文字や絵文字を途中で割らない。
 */
export function wrapLabel(
  label: string,
  perLine: number = LABEL_CHARS_PER_LINE,
  maxLines: number = LABEL_MAX_LINES,
): string[] {
  const words = label.trim().split(/\s+/).filter((word) => word !== "");
  const lines = words.flatMap((word) => chunkGraphemes(word, perLine));
  if (lines.length <= maxLines) {
    return lines;
  }

  const visible = lines.slice(0, maxLines);
  const last = splitGraphemes(visible[maxLines - 1]!).slice(0, perLine - 1);
  visible[maxLines - 1] = last.join("") + ELLIPSIS;
  return visible;
}
