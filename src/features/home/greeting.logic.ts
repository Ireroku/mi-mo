// 挨拶の計算。名前の前の言葉、一言の選び方、メッセージファイルの読み書き。

export type SalutationMode = "time" | "fixed" | "none";

export const FIXED_SALUTATION = "ごきげんよう";
export const MESSAGES_FILENAME = "mi-mo-greetings.txt";

const MORNING_START_HOUR = 5;
const DAYTIME_START_HOUR = 11;
const EVENING_START_HOUR = 18;

/**
 * 名前の前に置く言葉を返す。置かない場合は空文字を返す。
 * 保存済みの設定に mode が無い場合は、時間帯に合わせる。
 */
export function pickSalutation(
  date: Date,
  mode: SalutationMode = "time",
): string {
  if (mode === "none") {
    return "";
  }

  if (mode === "fixed") {
    return FIXED_SALUTATION;
  }

  const hour = date.getHours();
  if (hour >= MORNING_START_HOUR && hour < DAYTIME_START_HOUR) {
    return "おはようございます";
  }

  if (hour >= DAYTIME_START_HOUR && hour < EVENING_START_HOUR) {
    return "こんにちは";
  }

  return "こんばんは";
}

/**
 * 候補から一言を選ぶ。候補が2件以上あれば、直前に出した1件を避ける。
 */
export function pickMessage(
  messages: string[],
  last: string,
  random: () => number = Math.random,
): string | undefined {
  const fresh = messages.filter((message) => message !== last);
  const candidates = fresh.length > 0 ? fresh : messages;

  return candidates[Math.floor(random() * candidates.length)];
}

/**
 * メッセージファイルの中身を候補へ変える。1行が1件。
 * 前後の空白、空行、重複した行を除く。
 */
export function parseMessages(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  return [...new Set(lines)];
}

export function formatMessages(messages: string[]): string {
  return messages.map((message) => `${message}\n`).join("");
}
