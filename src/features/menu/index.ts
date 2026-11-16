import { mount, unmount, type Component } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { MenuManager, type MenuConfig } from "./navbar/menu.manager";
import ClockBadge from "./clock.svelte";
import CountdownBadge from "./countdownBadge.svelte";
import type { ClockConfig } from "./clock.logic";
import {
  sortPeriodsByStart,
  type PeriodSlot,
} from "@/utils/periods";
import { buildCountdownTargets, type CountdownConfig } from "./countdownBadge.logic";

export interface MenuBadgesConfig {
  clock: ClockConfig;
  countdowns: CountdownConfig[];
}

/**
 * ナビゲーションメニュー機能を初期化する。エントリーポイント（shared.content.ts）から呼び出す。
 */
export function initMenu(config: MenuConfig): void {
  const menuManager = new MenuManager();
  menuManager.applyConfig(config);
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
export async function initMenuBadges(
  ctx: ContentScriptContext,
  config: MenuBadgesConfig,
  periods: PeriodSlot[],
): Promise<void> {
  const periodTable = sortPeriodsByStart(periods);
  const countdownTargets = buildCountdownTargets(config.countdowns, periodTable);

  await Promise.all([
    mountBadge(ctx, "mimo-clock-badge", ClockBadge, { config: config.clock, periodTable }),
    mountBadge(ctx, "mimo-countdown-badge", CountdownBadge, { targets: countdownTargets }),
  ]);

  // Moodle はメニューに収まる項目数を resize の時にだけ計算する。
  // バッジで幅が減った分を反映させないと、項目が2段に折り返す。
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
}
