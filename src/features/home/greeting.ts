// ホームへ挨拶を出す。
// 名前の前の言葉とログインユーザー名、候補から選んだ一言を並べる。

import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { readUserName } from "@/moodle/user";
import { ensureHomeContainer } from "@/features/home/container";
import { mountShadowUi } from "@/utils/mountShadowUi";
import type { SalutationMode } from "./greeting.logic";
import { pickSalutation } from "./greeting.logic";
import { requestMessage } from "./defaultMessages";
import Greeting from "./Greeting.svelte";

export interface GreetingConfig {
  enabled: boolean;
  salutation?: SalutationMode; // この項目が増える前に保存された設定には無い
  useDefaultMessages: boolean; // 同梱の public/greetings.txt も候補に入れるか
  messages: string[]; // 利用者が足した一言
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
  const message = await requestMessage({
    custom: config.messages,
    useDefaults: config.useDefaultMessages,
    last: lastMessage,
  });
  await mountShadowUi(
    ctx,
    { name: "mimo-greeting", anchor: container, append: "last" },
    Greeting,
    { salutation, userName, message },
  );

  return message;
}
