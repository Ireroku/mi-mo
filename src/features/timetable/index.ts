// 時間割カレンダーをホーム（サイトホームまたはダッシュボード）にマウントする。

import { mount, unmount } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { PeriodSlot } from "@/utils/periods";
import { ensureHomeContainer } from "@/features/home/container";
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
  if (!container) return;

  const schedule = buildSchedule(config, periods);

  const ui = await createShadowRootUi(ctx, {
    name: "mimo-timetable",
    position: "inline",
    anchor: container,
    append: "last",
    onMount: (target) => {
      return mount(Timetable, {
        target,
        props: {
          config,
          periods,
          schedule,
        },
      });
    },
    onRemove: (mounted) => {
      if (mounted) unmount(mounted);
    },
  });

  ui.mount();
}
