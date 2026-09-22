// 右のブロックドロワーを隠すか、ピン留めしたコースの入口を差し込む。

import { mount, unmount } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { CourseRef } from "@/moodle/courseList";
import { applyStyleSheet } from "@/utils/styleSheet";
import PinnedCourses from "./PinnedCourses.svelte";

export interface QuickDrawerConfig {
  hidden: boolean;
  pinned: CourseRef[];
}

const STYLE_ID = "mimo-ui-quick-drawer";

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
  const target = document.querySelector(
    "#theme_boost-drawers-blocks #block-region-side-pre",
  );
  if (!target) return;

  const ui = await createShadowRootUi(ctx, {
    name: "mimo-pinned-courses",
    position: "inline",
    anchor: "#theme_boost-drawers-blocks #block-region-side-pre",
    append: "first",
    onMount: (container) => {
      return mount(PinnedCourses, {
        target: container,
        props: { courses: config.pinned },
      });
    },
    onRemove: (mounted) => {
      if (mounted) unmount(mounted);
    },
  });

  ui.mount();
}
