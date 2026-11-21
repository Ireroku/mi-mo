// ドロワー内の自動出欠ブロックから出席統計を読み取り、
// コースページ上部の見やすい位置に常時表示する。

import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { isCoursePage } from "@/moodle/page";
import { mountShadowUi } from "@/utils/mountShadowUi";
import AutoattendStats from "./AutoattendStats.svelte";

export interface AttendanceStats {
  present: number;
  late: number;
  earlyLeave: number;
  absent: number;
  rate: number; // 出席率（百分率の数値）
  detailUrl?: string;
}

export interface AutoattendStatsConfig {
  enabled: boolean;
}

function normalizeNumberString(text: string): string {
  return text.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
}

/**
 * 右ドロワーの自動出欠ブロックから出席統計を読み取る。
 * 必要な情報が揃わない場合は undefined を返す。
 */
export function readAttendanceStats(): AttendanceStats | undefined {
  const cardText = document.querySelector(".block_autoattend .card-text");
  if (!cardText) {
    return undefined;
  }

  // textContent または innerText を取得し、改行区切りにする
  const rawText =
    (cardText as HTMLElement).innerText || cardText.textContent || "";
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let present: number | undefined;
  let late: number | undefined;
  let earlyLeave: number | undefined;
  let absent: number | undefined;
  let rate: number | undefined;

  for (const line of lines) {
    const colonIndex = line.indexOf(":") !== -1 ? line.indexOf(":") : line.indexOf("：");
    if (colonIndex === -1) {
      continue;
    }

    const label = line.slice(0, colonIndex).trim();
    const rawVal = line.slice(colonIndex + 1).trim();
    const normalized = normalizeNumberString(rawVal);

    if (label === "出席") {
      const digits = normalized.replace(/[^\d]/g, "");
      if (digits) {
        present = parseInt(digits, 10);
      }
    } else if (label === "遅刻") {
      const digits = normalized.replace(/[^\d]/g, "");
      if (digits) {
        late = parseInt(digits, 10);
      }
    } else if (label === "早退") {
      const digits = normalized.replace(/[^\d]/g, "");
      if (digits) {
        earlyLeave = parseInt(digits, 10);
      }
    } else if (label === "欠席") {
      const digits = normalized.replace(/[^\d]/g, "");
      if (digits) {
        absent = parseInt(digits, 10);
      }
    } else if (label === "出席率") {
      const match = normalized.match(/[\d.]+/);
      if (match) {
        rate = parseFloat(match[0]);
      }
    }
  }

  if (
    present === undefined ||
    late === undefined ||
    earlyLeave === undefined ||
    absent === undefined ||
    rate === undefined
  ) {
    return undefined;
  }

  const detailAnchor = document.querySelector<HTMLAnchorElement>(
    '.block_autoattend a[href*="/blocks/autoattend/"]',
  );
  const detailUrl = detailAnchor?.href;

  return {
    present,
    late,
    earlyLeave,
    absent,
    rate,
    detailUrl,
  };
}

/**
 * コースページの出席統計表示を初期化する。
 */
export async function initAutoattendStats(
  ctx: ContentScriptContext,
  config: AutoattendStatsConfig,
): Promise<void> {
  if (!config.enabled || !isCoursePage()) {
    return;
  }

  const stats = readAttendanceStats();
  if (!stats) {
    return;
  }

  const anchor = document.querySelector("#region-main .secondary-navigation");
  if (!anchor) {
    return;
  }

  await mountShadowUi(
    ctx,
    { name: "mimo-autoattend-stats", anchor, append: "after" },
    AutoattendStats,
    { stats },
  );
}
