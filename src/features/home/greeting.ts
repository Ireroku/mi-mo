// ホームへ挨拶を出す。
// 名前の前の言葉とログインユーザー名、候補から選んだ一言を並べる。

import { mount, unmount } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { readUserName } from "@/moodle/user";
import { ensureHomeContainer } from "@/features/home/container";
import type { SalutationMode } from "./greeting.logic";
import { pickMessage, pickSalutation } from "./greeting.logic";
import Greeting from "./Greeting.svelte";

export interface GreetingConfig {
  enabled: boolean;
  salutation?: SalutationMode; // この項目が増える前に保存された設定には無い
  messages: string[];
}

/**
 * ホームの挨拶コンポーネントを初期化してマウントする。
 * 出した一言を返す。呼び出し側が保存し、次回の lastMessage として渡す。
 */
export async function initGreeting(
  ctx: ContentScriptContext,
  config: GreetingConfig,
  lastMessage: string,
): Promise<string | undefined> {
  const container = ensureHomeContainer();
  if (!container) {
    return undefined;
  }

  const userName = readUserName();
  const salutation = pickSalutation(new Date(), config.salutation);
  const message = pickMessage(config.messages, lastMessage);
  const ui = await createShadowRootUi(ctx, {
    name: "mimo-greeting",
    position: "inline",
    anchor: container,
    append: "last",
    onMount: (target) => {
      return mount(Greeting, {
        target,
        props: { salutation, userName, message },
      });
    },
    onRemove: (mounted) => {
      if (mounted) {
        unmount(mounted);
      }
    },
  });
  ui.mount();

  return message;
}
