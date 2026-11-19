// 拡張機能に同梱した既定の一言を扱う。
// 件数が増えても content script とストレージが大きくならないよう、一言は public/greetings.txt に置き、
// background が読んで1件だけを content script へ返す。

import { parseMessages, pickMessage } from "./greeting.logic";

export const GREETING_MESSAGE_TYPE = "mimo:greeting";

export interface GreetingRequest {
  type: typeof GREETING_MESSAGE_TYPE;
  custom: string[]; // 利用者が足した一言
  useDefaults: boolean;
  last: string; // 直前に出した一言
}

/**
 * 一言を1件選ぶよう background へ依頼する。content script から呼ぶ。
 */
export async function requestMessage(
  request: Omit<GreetingRequest, "type">,
): Promise<string | undefined> {
  const message: GreetingRequest = { type: GREETING_MESSAGE_TYPE, ...request };
  return browser.runtime.sendMessage(message);
}

/**
 * 既定の一言と利用者の一言を合わせた中から1件選ぶ。background から呼ぶ。
 * 既定の一言は呼ぶたびに読み、手元に残さない。
 */
export async function pickFromAll(
  request: GreetingRequest,
): Promise<string | undefined> {
  const defaults = request.useDefaults ? await readDefaults() : [];
  const messages = [...new Set([...defaults, ...request.custom])];
  return pickMessage(messages, request.last);
}

async function readDefaults(): Promise<string[]> {
  // public/ に置いたファイルは拡張機能の直下へ出る
  const response = await fetch(browser.runtime.getURL("/greetings.txt"));
  return parseMessages(await response.text());
}
