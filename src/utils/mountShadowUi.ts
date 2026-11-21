// Svelte コンポーネントを Shadow DOM の中へ描画し、ページの anchor の位置へ差し込む。
// 外す時（content script の無効化を含む）はコンポーネントも片付ける。

import { mount, unmount, type Component } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";

export interface ShadowUiOptions {
  name: string;
  anchor: string | Element;
  append: ContentScriptAppendMode;
  inheritStyles?: boolean;
}

/**
 * component を props で描画した Shadow DOM の UI を作り、差し込んでから返す。
 * コンポーネントが export する関数は、戻り値の `mounted` から呼べる。
 */
export async function mountShadowUi<
  Props extends Record<string, unknown>,
  Exports extends Record<string, unknown>,
>(
  ctx: ContentScriptContext,
  options: ShadowUiOptions,
  component: Component<Props, Exports>,
  props: Props,
): Promise<ShadowRootContentScriptUi<Exports>> {
  const ui = await createShadowRootUi(ctx, {
    ...options,
    position: "inline",
    onMount: (target) => mount(component, { target, props }),
    onRemove: (mounted) => {
      if (mounted) {
        unmount(mounted);
      }
    },
  });
  ui.mount();
  return ui;
}
