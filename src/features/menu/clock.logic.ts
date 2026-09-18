export interface ClockConfig {
  showSeconds?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showPeriod?: boolean;
}

export interface PeriodSlot {
  period: number;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

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

function toMinutes(hhmm: string): number {
  const [hours = 0, minutes = 0] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function findCurrentPeriod(
  date: Date,
  periods: PeriodSlot[],
): PeriodSlot | undefined {
  const minutes = dateToMinutes(date);
  return periods.find(
    (slot) => minutes >= toMinutes(slot.start) && minutes < toMinutes(slot.end),
  );
}

/**
 * 現在時刻以降で最も近い時限の開始時刻を返す。当日に残りの時限がなければ翌日の最初の時限にフォールバックする。
 * `sortedPeriods` は呼び出し側で `start` 昇順にソート済みであることを前提とする
 * （countdownの1秒tickごとに呼ばれるため、ここでのソートは避けている）。
 */
export function findNextPeriodStart(
  date: Date,
  sortedPeriods: PeriodSlot[],
): Date | undefined {
  if (sortedPeriods.length === 0) {
    return undefined;
  }

  const minutes = dateToMinutes(date);
  const todayNext = sortedPeriods.find((slot) => toMinutes(slot.start) > minutes);

  // sortedPeriodsはlength > 0からの派生なので必ず要素を持つ
  const slot = todayNext ?? sortedPeriods[0]!;
  const base = todayNext
    ? date
    : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const [hours = 0, mins = 0] = slot.start.split(":").map(Number);
  const target = new Date(base);
  target.setHours(hours, mins, 0, 0);
  return target;
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
