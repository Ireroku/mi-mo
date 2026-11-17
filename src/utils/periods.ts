// 大学の時限表を表す型と、時刻から時限を引く計算。
// 時計バッジ・カウントダウン・時間割の3つが同じ表を使うため、どれか1つの持ち物にせず切り出す。

export interface PeriodSlot {
  // 時限を指す変わらない番号。時間割の授業は、この番号 - 1 の位置に入る。並べ替えや名前の変更では変えない
  period: number;
  // 画面に出す名前。無いか空の場合は defaultPeriodName を使う
  name?: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

// 配列の並び順が、時間割と設定画面での表示順になる
export interface PeriodTableConfig {
  periods: PeriodSlot[];
}

const KANJI_DIGITS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

/**
 * 番号から既定の名前を作る。1〜10 は漢数字（一限）、それ以外は算用数字（11限）にする。
 */
export function defaultPeriodName(period: number): string {
  const kanji = KANJI_DIGITS[period - 1];
  return `${kanji ?? period}限`;
}

/**
 * 画面に出す名前を返す。
 */
export function periodName(slot: PeriodSlot): string {
  return slot.name?.trim() || defaultPeriodName(slot.period);
}

/**
 * 新しく足す時限の番号を返す。表の番号とも taken の番号とも重ならないよう、最大の次の番号にする。
 * taken には、時限を消した後も時間割に授業が残っている番号を渡す。渡さないと、足した時限に消した授業が戻る。
 */
export function nextPeriodNumber(
  periods: readonly PeriodSlot[],
  taken: Iterable<number> = [],
): number {
  return Math.max(0, ...periods.map((slot) => slot.period), ...taken) + 1;
}

/**
 * 番号を手で打てた頃の表（保存形式の版 1）を、今の形へ直す。
 * 番号は時限を指す変わらない値になったため、正の整数でない番号と、重なった番号の2つ目以降を落とす。
 * 当時は番号の順に画面へ出していたため、表示の順が変わらないよう番号の昇順に並べる。
 */
export function migratePeriodsFromV1(periods: readonly PeriodSlot[]): PeriodSlot[] {
  const seen = new Set<number>();
  return periods
    .filter((slot) => Number.isInteger(slot.period) && slot.period >= 1)
    .toSorted((a, b) => a.period - b.period)
    .filter((slot) => {
      if (seen.has(slot.period)) {
        return false;
      }
      seen.add(slot.period);
      return true;
    });
}

/**
 * 外から読み込んだ表を、今の形として使えるかで振り分ける。
 * 番号がすべて正の整数で重ならなければ、並びを含めてそのまま返す。
 * そうでない表は版 1 の頃のものとみなし、migratePeriodsFromV1 で直す。
 */
export function normalizePeriods(periods: readonly PeriodSlot[]): PeriodSlot[] {
  const numbers = periods.map((slot) => slot.period);
  const valid =
    numbers.every((period) => Number.isInteger(period) && period >= 1) &&
    new Set(numbers).size === numbers.length;

  if (valid) {
    return [...periods];
  }
  return migratePeriodsFromV1(periods);
}

function toMinutes(hhmm: string): number {
  const [hours = 0, minutes = 0] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

const HHMM = /^\d{2}:\d{2}$/;

/**
 * 開始と終了の時刻がそろった枠だけを、start の昇順に並べた新しい配列で返す。元の配列を書き換えない。
 * 足したばかりで時刻の空いた枠は、時計とカウントダウンの計算に入れない。
 */
export function sortPeriodsByStart(periods: readonly PeriodSlot[]): PeriodSlot[] {
  return periods
    .filter((slot) => HHMM.test(slot.start) && HHMM.test(slot.end))
    .toSorted((a, b) => a.start.localeCompare(b.start));
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

export interface PeriodSegment {
  // during は時限の最中、before は時限の前（休み時間か、その日の最初の時限の前）
  phase: "during" | "before";
  slot: PeriodSlot;
  // 区切りの時刻。during なら slot の終了、before なら slot の開始。日付は date と同じ日
  at: Date;
}

function atMinutes(date: Date, hhmm: string): Date {
  const [hours = 0, minutes = 0] = hhmm.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}

/**
 * 現在時刻を含む区切りを返す。時限の最中ならその終了、時限の前なら次の時限の開始を指す。
 * 時限は start 以上 end 未満を最中とみなす。その日に残りの時限が無ければ undefined。翌日へは回さない。
 * sortedPeriods はソート済みの表を前提とする。
 */
export function findPeriodSegment(
  date: Date,
  sortedPeriods: readonly PeriodSlot[],
): PeriodSegment | undefined {
  const minutes = dateToMinutes(date);
  for (const slot of sortedPeriods) {
    if (minutes < toMinutes(slot.start)) {
      return { phase: "before", slot, at: atMinutes(date, slot.start) };
    }
    if (minutes < toMinutes(slot.end)) {
      return { phase: "during", slot, at: atMinutes(date, slot.end) };
    }
  }
  return undefined;
}
