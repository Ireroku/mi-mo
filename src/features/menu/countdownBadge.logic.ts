import { findNextPeriodStart, type PeriodSlot } from "@/utils/periods";

export interface CountdownTarget {
  id: string;
  label: string;
  getTargetTime: () => Date;
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

export function describeCountdown(
  target: CountdownTarget,
  now: Date = new Date(),
): string {
  return formatRemaining(target.getTargetTime().getTime() - now.getTime());
}

/**
 * 保存できる形の CountdownConfig[] を、実行時の CountdownTarget[] へ変換する。
 * periods はソート済みであることを前提とする（findNextPeriodStart の要件を引き継ぐ）。
 */
export function buildCountdownTargets(
  configs: CountdownConfig[],
  periods: PeriodSlot[],
): CountdownTarget[] {
  return configs.map(({ id, label, source }) => {
    switch (source.kind) {
      case "nextPeriod":
        return {
          id,
          label,
          getTargetTime: () => findNextPeriodStart(new Date(), periods) ?? new Date(),
        };
      case "fixedDate":
        return {
          id,
          label,
          getTargetTime: () => new Date(source.at),
        };
    }
  });
}
