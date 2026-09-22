// 大学の時限表を表す型と、時刻から時限を引く計算。
// 時計バッジ・カウントダウン・時間割の3つが同じ表を使うため、どれか1つの持ち物にせず切り出す。

export interface PeriodSlot {
  period: number;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface PeriodTableConfig {
  periods: PeriodSlot[];
}

function toMinutes(hhmm: string): number {
  const [hours = 0, minutes = 0] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * start の昇順に並べた新しい配列を返す。元の配列を書き換えない。
 */
export function sortPeriodsByStart(periods: PeriodSlot[]): PeriodSlot[] {
  return [...periods].sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * start 以上 end 未満に現在時刻が収まる枠を返す。無ければ undefined。
 */
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
 * 現在時刻より後で最も近い開始時刻を返す。当日に残りが無ければ翌日の最初の時限へ回す。空の表なら undefined。
 * sortedPeriods はソート済みの表を前提とする。
 */
export function findNextPeriodStart(
  date: Date,
  sortedPeriods: PeriodSlot[],
): Date | undefined {
  if (sortedPeriods.length === 0) {
    return undefined;
  }

  const minutes = dateToMinutes(date);
  const todayNext = sortedPeriods.find(
    (slot) => toMinutes(slot.start) > minutes,
  );

  const slot = todayNext ?? sortedPeriods[0]!;
  const base = todayNext
    ? date
    : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const [hours = 0, mins = 0] = slot.start.split(":").map(Number);
  const target = new Date(base);
  target.setHours(hours, mins, 0, 0);
  return target;
}
