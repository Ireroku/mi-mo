// コースページにある出欠リンクを取り出し、目立つボタンとして配置する。
// 配置場所は最上部（top）または画面右下固定（floating）から選択する。

import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { isCoursePage } from "@/moodle/page";
import { mountShadowUi } from "@/utils/mountShadowUi";
import AutoattendButton from "./AutoattendButton.svelte";

export type AutoattendButtonPlacement = "top" | "floating";

export interface AutoattendButtonConfig {
  enabled: boolean;
  placement: AutoattendButtonPlacement;
}

/**
 * コースページの出欠ボタンを初期化する。
 */
export async function initAutoattendButton(
  ctx: ContentScriptContext,
  config: AutoattendButtonConfig,
): Promise<void> {
  if (!isCoursePage()) {
    return;
  }

  const autoattendLink = document.querySelector<HTMLAnchorElement>(
    "#region-main li.activity.modtype_autoattendmod a.aalink",
  );
  if (!autoattendLink) {
    return;
  }

  const href = autoattendLink.href;
  if (!href) {
    return;
  }

  const anchor =
    config.placement === "top"
      ? document.querySelector("#region-main div.course-content")
      : document.body;
  if (!anchor) {
    return;
  }

  const append = config.placement === "top" ? "before" : "last";
  await mountShadowUi(
    ctx,
    { name: "mimo-autoattend-button", anchor, append },
    AutoattendButton,
    { href, placement: config.placement },
  );
}
