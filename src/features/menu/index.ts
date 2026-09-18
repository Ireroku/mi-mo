import { mount, unmount, type Component } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { MenuManager, type MenuConfig } from "./navbar/menu.manager";
import ClockBadge from "./clock.svelte";
import CountdownBadge from "./countdownBadge.svelte";
import { findNextPeriodStart, type ClockConfig, type PeriodSlot } from "./clock.logic";
import type { CountdownTarget } from "./countdownBadge.logic";

const menuConfig: MenuConfig = {
  hidden: [
    "Office365",
    "Google",
    "eラーニング",
    "Scilets",
    "三重創生ファンタジスタ",
    "旧Moodle",
  ],
};

const clockConfig: ClockConfig = {
  showSeconds: true,
  showDate: true,
  showWeekday: true,
  showPeriod: true,
};

// 三重大学の標準時限割
const periodTable: PeriodSlot[] = [
  { period: 1, start: "09:00", end: "10:30" },
  { period: 2, start: "10:40", end: "12:10" },
  { period: 3, start: "13:00", end: "14:30" },
  { period: 4, start: "14:40", end: "16:10" },
  { period: 5, start: "16:20", end: "17:50" },
  { period: 6, start: "18:00", end: "19:30" },
];

const countdownTargets: CountdownTarget[] = [
  {
    id: "next-period",
    label: "次の時限まで",
    getTargetTime: () => findNextPeriodStart(new Date(), periodTable) ?? new Date(),
  },
];

/**
 * ナビゲーションメニュー機能を初期化する。エントリーポイント（shared.content.ts）から呼び出す。
 */
export function initMenu(): void {
  const menuManager = new MenuManager();
  menuManager.applyConfig(menuConfig);
}

/**
 * SvelteコンポーネントをShadow DOM経由でnavbarにマウントする共通処理。
 */
async function mountBadge<Props extends Record<string, unknown>>(
  ctx: ContentScriptContext,
  name: string,
  component: Component<Props>,
  props: Props,
): Promise<void> {
  const ui = await createShadowRootUi(ctx, {
    name,
    position: "inline",
    anchor: "#usernavigation",
    append: "before",
    onMount: (container) => mount(component, { target: container, props }),
    onRemove: (mounted) => {
      if (mounted) {
        unmount(mounted);
      }
    },
  });
  ui.mount();
}

/**
 * 時計・カウントダウンバッジをShadow DOM経由でnavbarに差し込む。エントリーポイント（shared.content.ts）から呼び出す。
 */
export async function initMenuBadges(ctx: ContentScriptContext): Promise<void> {
  await Promise.all([
    mountBadge(ctx, "mimo-clock-badge", ClockBadge, { config: clockConfig, periodTable }),
    mountBadge(ctx, "mimo-countdown-badge", CountdownBadge, { targets: countdownTargets }),
  ]);
}
