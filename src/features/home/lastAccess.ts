// 前回 Moodle を開いた日時をホームへ出す。
// 拡張機能が自分で記録した時刻を使い、30分以内の再訪は同じセッションとみなす。

import { mount, unmount } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { ensureHomeContainer } from "@/features/home/container";
import LastAccess from "./LastAccess.svelte";

export interface LastAccessRecord {
  previous: string; // ISO の日時。初回は空文字
  current: string; // ISO の日時。初回は空文字
}

export const SESSION_GAP_MS = 30 * 60 * 1000;

/**
 * 現在のアクセス時刻に基づいて記録を進める。
 * 30分以内の再訪は同じセッションとみなし current のみを更新する。
 */
export function advanceRecord(
  record: LastAccessRecord,
  now: Date,
): LastAccessRecord {
  const nowIso = now.toISOString();
  if (!record.current) {
    return { previous: "", current: nowIso };
  }

  const currentDate = new Date(record.current);
  const diffMs = now.getTime() - currentDate.getTime();

  if (diffMs < SESSION_GAP_MS) {
    return {
      previous: record.previous,
      current: nowIso,
    };
  }

  return {
    previous: record.current,
    current: nowIso,
  };
}

/**
 * 最終アクセス日時コンポーネントを初期化してマウントする。
 */
export async function initLastAccess(
  ctx: ContentScriptContext,
  record: LastAccessRecord,
): Promise<void> {
  if (!record.previous) return;

  const container = ensureHomeContainer();
  if (!container) return;

  const ui = await createShadowRootUi(ctx, {
    name: "mimo-last-access",
    position: "inline",
    anchor: container,
    append: "last",
    onMount: (target) => {
      return mount(LastAccess, {
        target,
        props: { previous: record.previous },
      });
    },
    onRemove: (mounted) => {
      if (mounted) unmount(mounted);
    },
  });

  ui.mount();
}
