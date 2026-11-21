// 右のブロックドロワーを隠すか、ピン留めしたコースの入口を差し込む。

import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { CourseRef } from "@/moodle/courseList";
import { applyStyleSheet } from "@/utils/styleSheet";
import { mountShadowUi } from "@/utils/mountShadowUi";
import PinnedCourses from "./PinnedCourses.svelte";

export interface QuickDrawerConfig {
  hidden: boolean;
  pinned: CourseRef[];
}

const STYLE_ID = "mimo-ui-quick-drawer";

// ドロワーの中で、ブロックが並ぶ場所。ほかの機能がドロワーへブロックを足す時も使う
export const DRAWER_REGION_SELECTOR = "#theme_boost-drawers-blocks #block-region-side-pre";

const HIDE_CSS = `
#theme_boost-drawers-blocks,
[data-action="toggle"][data-target="theme_boost-drawers-blocks"] {
  display: none !important;
}
`;

/**
 * 右ブロックドロワーの表示・非表示を切り替える。
 */
export function applyQuickDrawerVisibility(config: QuickDrawerConfig): void {
  applyStyleSheet(STYLE_ID, config.hidden ? HIDE_CSS : "");
}

/**
 * 右ブロックドロワーの先頭へピン留めコース一覧を差し込む。
 */
export async function initPinnedCourses(
  ctx: ContentScriptContext,
  config: QuickDrawerConfig,
): Promise<void> {
  const target = document.querySelector(DRAWER_REGION_SELECTOR);
  if (!target) {
    return;
  }

  await mountShadowUi(
    ctx,
    { name: "mimo-pinned-courses", anchor: target, append: "first" },
    PinnedCourses,
    { courses: config.pinned },
  );
}
