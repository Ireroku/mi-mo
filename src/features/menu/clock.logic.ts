export interface ClockConfig {
  showSeconds?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showPeriod?: boolean;
}

export type { PeriodSlot } from "@/utils/periods";
export { findCurrentPeriod, findNextPeriodStart } from "@/utils/periods";

export type ClockGranularity = "second" | "minute";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatTime(date: Date, showSeconds: boolean): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  if (!showSeconds) {
    return `${hh}:${mm}`;
  }

  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatWeekday(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}曜日`;
}

function msUntilNextBoundary(date: Date, granularity: ClockGranularity): number {
  const unitMs = granularity === "second" ? 1000 : 60_000;
  return unitMs - (date.getTime() % unitMs);
}

/**
 * setIntervalのドリフトを避けるため、次の秒/分境界までの残りmsを計算してsetTimeoutで自己補正するループ。
 * バックグラウンドタブでのタイマー間引き対策として、visibilitychangeで復帰時に即再計算する。
 */
export function startClockTicker(
  onTick: (now: Date) => void,
  granularity: ClockGranularity = "second",
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const tick = () => {
    const now = new Date();
    onTick(now);
    timeoutId = setTimeout(tick, msUntilNextBoundary(now, granularity));
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      clearTimeout(timeoutId);
      tick();
    }
  };

  tick();
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    clearTimeout(timeoutId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
