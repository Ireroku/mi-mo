export interface ClockConfig {
  showSeconds?: boolean;
  showYear?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showPeriod?: boolean;
  hour12?: boolean;
}

export type { PeriodSlot } from "@/utils/periods";
export { findCurrentPeriod, findNextPeriodStart } from "@/utils/periods";

export type ClockGranularity = "second" | "minute";

const LOCALE = "ja-JP";

export function formatTime(date: Date, config: ClockConfig): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: config.hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    second: config.showSeconds ? "2-digit" : undefined,
    hourCycle: config.hour12 ? "h12" : "h23",
  }).format(date);
}

/**
 * 日付と曜日を1つの文字列にする。どちらも出さない設定では空文字を返す。
 * 年は日付と一緒にだけ出す。
 */
export function formatDate(date: Date, config: ClockConfig): string {
  if (!config.showDate && !config.showWeekday) {
    return "";
  }

  return new Intl.DateTimeFormat(LOCALE, {
    year: config.showDate && config.showYear ? "numeric" : undefined,
    // numeric は曜日が無い時に「11/7」となるため、常に「11月」を返す long を使う
    month: config.showDate ? "long" : undefined,
    day: config.showDate ? "numeric" : undefined,
    weekday: config.showWeekday ? "short" : undefined,
  }).format(date);
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
