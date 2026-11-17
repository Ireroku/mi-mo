export interface ClockConfig {
  showSeconds?: boolean;
  showYear?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showPeriod?: boolean;
  hour12?: boolean;
}

import { chunkGraphemes, truncateGraphemes } from "@/utils/graphemes";

export type { PeriodSlot } from "@/utils/periods";
export { findCurrentPeriod, periodName } from "@/utils/periods";

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
 * 日付と曜日を「11/17 火」の形の1つの文字列にする。どちらも出さない設定では空文字を返す。
 * 年は日付と一緒にだけ出す（「2026/11/17 火」）。
 */
export function formatDate(date: Date, config: ClockConfig): string {
  const parts: string[] = [];
  if (config.showDate) {
    parts.push(
      new Intl.DateTimeFormat(LOCALE, {
        year: config.showYear ? "numeric" : undefined,
        month: "numeric",
        day: "numeric",
      }).format(date),
    );
  }
  if (config.showWeekday) {
    parts.push(new Intl.DateTimeFormat(LOCALE, { weekday: "short" }).format(date));
  }
  return parts.join(" ");
}

export const PERIOD_CHARS_PER_COLUMN = 2;
export const PERIOD_MAX_COLUMNS = 2;

/**
 * 時限の名前を縦書きの列に分け、列の間を改行でつないだ1つの文字列にする。
 * 収まらない名前は、最後の列の末尾を「…」にする（「昼休み」は「昼休\nみ」、「1-2限目」は「1-\n2…」）。
 */
export function formatPeriodName(name: string): string {
  const visible = truncateGraphemes(name, PERIOD_CHARS_PER_COLUMN * PERIOD_MAX_COLUMNS);
  return chunkGraphemes(visible, PERIOD_CHARS_PER_COLUMN).join("\n");
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
