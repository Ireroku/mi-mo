// 時刻の入力欄に打った文字を "HH:MM" へ揃える。

const COLON_FORM = /^(\d{1,2}):(\d{2})$/;
const DIGITS_FORM = /^\d{1,4}$/;

/**
 * 打った文字を "HH:MM" にして返す。時刻として読めなければ undefined を返す。
 * 受け付ける形は「9:30」「14:30」と、区切りの無い数字（「9」「930」「0930」）。
 * 全角の数字とコロンも受け付ける。
 */
export function normalizeTime(text: string): string | undefined {
  const value = text.normalize("NFKC").trim();

  let hours: string;
  let minutes: string;
  const colon = COLON_FORM.exec(value);
  if (colon) {
    hours = colon[1]!;
    minutes = colon[2]!;
  } else if (DIGITS_FORM.test(value)) {
    // 2桁までは時だけ、3桁以上は末尾の2桁を分として読む
    hours = value.length <= 2 ? value : value.slice(0, -2);
    minutes = value.length <= 2 ? "0" : value.slice(-2);
  } else {
    return undefined;
  }

  const h = Number(hours);
  const m = Number(minutes);
  if (h > 23 || m > 59) {
    return undefined;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
