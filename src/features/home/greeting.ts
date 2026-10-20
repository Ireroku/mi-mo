// ホームへ挨拶を出す。
// ログインユーザー名と、候補から選んだ一言を並べる。

import { mount, unmount } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { readUserName } from "@/moodle/user";
import { ensureHomeContainer } from "@/features/home/container";
import Greeting from "./Greeting.svelte";

export interface GreetingConfig {
  enabled: boolean;
  messages: string[];
}

function pickRandomMessage(messages: string[]): string | undefined {
  if (messages.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

/**
 * ホームの挨拶コンポーネントを初期化してマウントする。
 */
export async function initGreeting(
  ctx: ContentScriptContext,
  config: GreetingConfig,
): Promise<void> {
  const container = ensureHomeContainer();
  if (!container) {
    return;
  }

  const userName = readUserName();
  const message = pickRandomMessage(config.messages);
  const ui = await createShadowRootUi(ctx, {
    name: "mimo-greeting",
    position: "inline",
    anchor: container,
    append: "last",
    onMount: (target) => {
      return mount(Greeting, {
        target,
        props: { userName, message },
      });
    },
    onRemove: (mounted) => {
      if (mounted) {
        unmount(mounted);
      }
    },
  });
  ui.mount();
}
