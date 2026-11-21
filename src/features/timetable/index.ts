// 時間割カレンダーをホーム（サイトホームまたはダッシュボード）にマウントする。

import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { PeriodSlot } from "@/utils/periods";
import { ensureHomeContainer } from "@/features/home/container";
import { mountShadowUi } from "@/utils/mountShadowUi";
import type { TimetableConfig } from "./types";
import { buildSchedule } from "./schedule.logic";
import Timetable from "./Timetable.svelte";

export * from "./types";
export * from "./schedule.logic";
export * from "./ics";

/**
 * ホームに時間割カレンダーを初期化してマウントする。
 */
export async function initTimetable(
  ctx: ContentScriptContext,
  config: TimetableConfig,
  periods: PeriodSlot[],
): Promise<void> {
  const container = ensureHomeContainer();
  if (!container) {
    return;
  }

  const schedule = buildSchedule(config, periods);
  await mountShadowUi(
    ctx,
    { name: "mimo-timetable", anchor: container, append: "last" },
    Timetable,
    { config, periods, schedule },
  );
}
