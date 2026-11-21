import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { applyMenuConfig } from "./navbar/menu.manager";
import type { MenuConfig } from "./navbar/types";
import ClockBadge from "./clock.svelte";
import CountdownBadge from "./countdownBadge.svelte";
import DrawerClock from "./drawerClock.svelte";
import { HiddenTracker } from "./visibility.svelte";
import type { ClockConfig } from "./clock.logic";
import {
  sortPeriodsByStart,
  type PeriodSlot,
} from "@/utils/periods";
import {
  buildCountdownTargets,
  type CountdownConfig,
  type CountdownThresholds,
} from "./countdownBadge.logic";
import { applyStyleSheet } from "@/utils/styleSheet";
import { mountShadowUi } from "@/utils/mountShadowUi";
import { DRAWER_REGION_SELECTOR } from "@/features/ui/quickDrawer";
import { buildSchedule, hasLessons } from "@/features/timetable/schedule.logic";
import type { TimetableConfig } from "@/features/timetable/types";

const STYLE_ID = "mimo-menu-badges";
const SLOT_CLASS = "mimo-countdown-slot";

// カウントダウンの置き場所は、メニューの残りの幅だけを受け取る（flex-basis 0 で伸びるだけ）。
// 幅を奪わないため、Moodle の「さらに」の計算はバッジが無い時と同じになる。
// 伸びる置き場所が空きを吸うため、時計と通知は右端に寄ったまま離れない。
// バッジの host は WXT の :host{all:initial !important} で外からの指定が効かないため、自前の要素に当てる
const CSS = `
nav.navbar .${SLOT_CLASS} {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
nav.navbar #usernavigation {
  margin-left: 0 !important;
}
`;

export interface MenuBadgesConfig {
  showClock: boolean;
  clock: ClockConfig;
  countdowns: CountdownConfig[];
  thresholds: CountdownThresholds;
}

/**
 * ナビゲーションメニュー機能を初期化する。エントリーポイント（shared.content.ts）から呼び出す。
 */
export function initMenu(config: MenuConfig): void {
  applyMenuConfig(config);
}

/**
 * 時計・カウントダウンバッジをShadow DOM経由でnavbarに差し込む。エントリーポイント（shared.content.ts）から呼び出す。
 * 時間割が有効で授業が入っており、カウントダウンを時間割に合わせる設定なら、時限のカウントダウンは授業のある時限だけを数える。
 * drawer が true でページに右のドロワーがあれば、メニューで隠れた時計とカウントダウンをドロワーの先頭のブロックへ移す。
 */
export async function initMenuBadges(
  ctx: ContentScriptContext,
  config: MenuBadgesConfig,
  periods: PeriodSlot[],
  timetable: TimetableConfig,
  drawer: boolean,
): Promise<void> {
  const periodTable = sortPeriodsByStart(periods);
  const sync =
    timetable.enabled && timetable.syncCountdown !== false && hasLessons(timetable);
  const schedule = sync ? buildSchedule(timetable, periodTable) : undefined;
  const countdownTargets = buildCountdownTargets(config.countdowns, periodTable, schedule);

  const userNavigation = document.querySelector("#usernavigation");
  if (!userNavigation) {
    return;
  }
  applyStyleSheet(STYLE_ID, CSS);
  // 並びはカウントダウンの置き場所、時計、Moodle の通知の順。置き場所はカウントダウンが無くても空きを吸うために置く
  const slot = document.createElement("div");
  slot.className = SLOT_CLASS;
  userNavigation.before(slot);
  ctx.onInvalidated(() => slot.remove());

  // 隠れたかどうかは、メニューのバッジが見張り、ドロワーのブロックが読む。控えはこの2つの見張り役だけが持つ
  const region = drawer ? document.querySelector(DRAWER_REGION_SELECTOR) : null;
  const trackers = region
    ? { clock: new HiddenTracker<string>(), countdowns: new HiddenTracker<string>() }
    : undefined;
  if (trackers) {
    ctx.onInvalidated(() => {
      trackers.clock.disconnect();
      trackers.countdowns.disconnect();
    });
  }

  await mountShadowUi(
    ctx,
    { name: "mimo-countdown-badge", anchor: slot, append: "last" },
    CountdownBadge,
    {
      targets: countdownTargets,
      thresholds: config.thresholds,
      watch: trackers?.countdowns.watch,
    },
  );
  // 時計を出さない時は、ドロワーにも時計が出ない。ドロワーはメニューの時計が隠れた時だけ時計を出す
  if (config.showClock) {
    await mountShadowUi(
      ctx,
      { name: "mimo-clock-badge", anchor: userNavigation, append: "before" },
      ClockBadge,
      {
        config: config.clock,
        periodTable,
        watch: trackers?.clock.watch,
      },
    );
  }
  // ブロックの並びの外（直前）へ置き、ピン留めのブロックとどちらが先に差し込まれても先頭に来るようにする
  if (region && trackers) {
    await mountShadowUi(
      ctx,
      { name: "mimo-drawer-clock", anchor: region, append: "before" },
      DrawerClock,
      {
        clock: config.clock,
        periodTable,
        targets: countdownTargets,
        thresholds: config.thresholds,
        hiddenClock: trackers.clock,
        hiddenCountdowns: trackers.countdowns,
      },
    );
  }

  // Moodle はメニューに収まる項目数を resize の時にだけ計算する。
  // バッジで幅が減った分を反映させないと、項目が2段に折り返す。
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
}
