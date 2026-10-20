// 時間割を iCalendar (.ics) 形式にエクスポートする。

import type { PeriodSlot } from "@/utils/periods";
import type { TimetableConfig, Weekday } from "./types";
import {
  buildSchedule,
  weekdayOf,
  type LessonOccurrence,
} from "./schedule.logic";

export const ICS_FILENAME = "timetable.ics";

const WEEKDAY_BYDAY: Record<Weekday, string> = {
  mon: "MO",
  tue: "TU",
  wed: "WE",
  thu: "TH",
  fri: "FR",
};

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) {
    return line;
  }

  const result: string[] = [];
  let current = "";
  let currentBytes = 0;
  let isFirst = true;
  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    const max = isFirst ? 75 : 74;
    if (currentBytes + charBytes > max) {
      result.push(current);
      current = " " + char;
      currentBytes = 1 + charBytes;
      isFirst = false;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }

  if (current) {
    result.push(current);
  }

  return result.join("\r\n");
}

/**
 * 日本時間の日付と "HH:MM" 文字列から UTC の ISO 類似形式 (YYYYMMDDTHHMMSSZ) を生成する。
 */
function toUtcString(date: Date, timeStr: string): string {
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  // 日本時間（UTC+9）のローカル日時を作成
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    h ?? 0,
    m ?? 0,
    0,
  );

  const pad = (n: number) => String(n).padStart(2, "0");
  const y = localDate.getUTCFullYear();
  const mon = pad(localDate.getUTCMonth() + 1);
  const d = pad(localDate.getUTCDate());
  const hour = pad(localDate.getUTCHours());
  const min = pad(localDate.getUTCMinutes());
  const sec = pad(localDate.getUTCSeconds());
  return `${y}${mon}${d}T${hour}${min}${sec}Z`;
}

function formatDtstamp(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getUTCFullYear();
  const mon = pad(now.getUTCMonth() + 1);
  const d = pad(now.getUTCDate());
  const hour = pad(now.getUTCHours());
  const min = pad(now.getUTCMinutes());
  const sec = pad(now.getUTCSeconds());
  return `${y}${mon}${d}T${hour}${min}${sec}Z`;
}

/**
 * 時間割設定から .ics 形式の文字列を生成する。
 */
export function buildIcs(
  config: TimetableConfig,
  periods: PeriodSlot[],
): string {
  const schedule = buildSchedule(config, periods);
  const now = new Date();
  const dtstamp = formatDtstamp(now);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mi-mo//Moodle Extension//JA",
    "CALSCALE:GREGORIAN",
  ];

  // コマごとにグルーピング
  const slotGroups = new Map<string, LessonOccurrence[]>();
  const substituteLessons: LessonOccurrence[] = [];
  for (const occ of schedule) {
    const actualWeekday = weekdayOf(occ.date);
    if (actualWeekday !== occ.weekday) {
      substituteLessons.push(occ);
    } else {
      const key = `${occ.weekday}-${occ.periodIndex}`;
      let group = slotGroups.get(key);
      if (!group) {
        group = [];
        slotGroups.set(key, group);
      }
      group.push(occ);
    }
  }

  // 1. 通常の週繰り返し VEVENT
  const weekdays: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];
  for (const w of weekdays) {
    const list = config.grid[w] || [];
    for (let periodIdx = 0; periodIdx < list.length; periodIdx++) {
      const slot = list[periodIdx];
      if (!slot) {
        continue;
      }

      const key = `${w}-${periodIdx}`;
      const group = slotGroups.get(key) || [];
      const period = periods.find((p) => p.period === periodIdx + 1);
      const startTime = period?.start ?? "09:00";
      const endTime = period?.end ?? "10:30";

      // 該当コマの通常実施が全くない場合はスキップ（振替だけで実施される極端なケース）
      if (group.length === 0) {
        continue;
      }

      const firstOcc = group[0];
      const lastOcc = group[group.length - 1];
      if (!firstOcc || !lastOcc) {
        continue;
      }

      const dtstart = toUtcString(firstOcc.date, startTime);
      const dtend = toUtcString(firstOcc.date, endTime);
      const until = toUtcString(lastOcc.date, endTime);
      const byday = WEEKDAY_BYDAY[w];

      const exdates: string[] = [];
      const carriedOutDates = new Set(
        group.map((o) => `${o.date.getFullYear()}-${o.date.getMonth()}-${o.date.getDate()}`),
      );
      // 初回日から最終回日までの本来の曜日で、授業が実施されなかった日を抽出
      const cursor = new Date(firstOcc.date);
      while (cursor <= lastOcc.date) {
        const cursorKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        if (!carriedOutDates.has(cursorKey)) {
          exdates.push(toUtcString(cursor, startTime));
        }
        cursor.setDate(cursor.getDate() + 7);
      }

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${w}-${periodIdx + 1}@mi-mo`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}`);
      for (const ex of exdates) {
        lines.push(`EXDATE:${ex}`);
      }
      lines.push(`SUMMARY:${escapeIcsText(slot.title)}`);
      if (slot.url) {
        lines.push(`URL:${escapeIcsText(slot.url)}`);
      }
      lines.push("END:VEVENT");
    }
  }

  // 2. 振替日の単発 VEVENT
  for (const occ of substituteLessons) {
    const period = periods.find((p) => p.period === occ.periodIndex + 1);
    const startTime = period?.start ?? "09:00";
    const endTime = period?.end ?? "10:30";

    const dtstart = toUtcString(occ.date, startTime);
    const dtend = toUtcString(occ.date, endTime);
    const dateSlug = `${occ.date.getFullYear()}${String(occ.date.getMonth() + 1).padStart(2, "0")}${String(occ.date.getDate()).padStart(2, "0")}`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${occ.weekday}-${occ.periodIndex + 1}-${dateSlug}@mi-mo`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${escapeIcsText(occ.slot.title)}`);
    if (occ.slot.url) {
      lines.push(`URL:${escapeIcsText(occ.slot.url)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // 行折り返し適用
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
