# lastAccess モジュール

## 概要

前回 Moodle を開いた日時をホームへ出す。拡張機能が自分で記録した時刻を使い、Moodle 側の最終ログイン時刻は参照しない。

## 関連

- 使う: [`./container.md`](./container.md) — ホームへ差し込む器
- 使う: [`../utils/settings.md`](../utils/settings.md) — 記録を置くストレージ項目
- 資料: [`../../features/home/last-login.md`](../../features/home/last-login.md) — 表示する動機
- 参考: [`./greeting.md`](./greeting.md) — 同じ器へ並ぶ機能

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/home/lastAccess.ts` | 記録の型と差し込み |
| `src/features/home/LastAccess.svelte` | 日時の描画 |
| `src/utils/settings.ts` | 記録のストレージ項目 |
| `src/entrypoints/shared.content.ts` | 記録を読み、機能を呼び、記録を更新する |

## インターフェース

```ts
// src/features/home/lastAccess.ts
export interface LastAccessRecord {
  previous: string; // ISO の日時。初回は空文字
  current: string; // ISO の日時。初回は空文字
}

export const SESSION_GAP_MS = 30 * 60 * 1000;

export function advanceRecord(
  record: LastAccessRecord,
  now: Date,
): LastAccessRecord;

export async function initLastAccess(
  ctx: ContentScriptContext,
  record: LastAccessRecord,
): Promise<void>;
```

```ts
// LastAccess.svelte の Props
interface Props {
  previous: string;
}
```

記録の定義:

```ts
// src/utils/settings.ts
export const homeLastAccessRecord = storage.defineItem<LastAccessRecord>(
  "local:home.lastAccess",
  { fallback: { previous: "", current: "" } },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。表示に使うのは更新前の記録で、更新は表示の後に行います。

```ts
// src/entrypoints/shared.content.ts
import { advanceRecord, initLastAccess } from "@/features/home/lastAccess";
import { homeLastAccessRecord } from "@/utils/settings";

const record = await homeLastAccessRecord.getValue();
await initLastAccess(ctx, record);
await homeLastAccessRecord.setValue(advanceRecord(record, new Date()));
```

## 処理の流れ

### advanceRecord

1. `record.current` が空文字の場合、`{ previous: "", current: now }` を返す
2. `now` と `record.current` の差が `SESSION_GAP_MS` 未満の場合、`previous` を保ったまま `current` だけを `now` にする
3. 差が `SESSION_GAP_MS` 以上の場合、`current` を `previous` へ繰り上げ、`current` を `now` にする

### initLastAccess

1. `record.previous` が空文字なら何もせず戻る
2. `ensureHomeContainer()` を呼ぶ。`undefined` なら何もせず戻る
3. `createShadowRootUi` で `LastAccess.svelte` をマウントする

| 設定 | 値 |
|---|---|
| `name` | `mimo-last-access` |
| `position` | `inline` |
| `anchor` | `ensureHomeContainer()` の戻り値 |
| `append` | `last` |

### LastAccess.svelte

`previous` を `2026/9/21 14:30` の形で出す。前に「前回のアクセス」と添える。

## 決めごと

- **Moodle 側の最終ログイン時刻を使わず、拡張機能が記録した時刻を出す。** Moodle の最終アクセスはホームの DOM に出ておらず、読むにはプロフィールページを別途取りに行くことになる。ページを開くたびに通信するには重い情報で、仕様書が挙げる動機（賑やかしと、取り組みの記録が見えること）は自前の記録でも満たせる
- **表示の文言を「前回のアクセス」にする。** 出しているのが拡張機能から見たアクセス時刻で、Moodle のログイン記録そのものではないため、名前を合わせておく
- **30分以内の再訪を同じセッションとみなす。** ページを移動するたびに「前回」が数分前へ進むと、情報として意味を失う。間隔を空けて開き直した時に前回が繰り上がる
- **表示に使うのは更新前の記録にする。** 先に更新すると、いま開いたこの瞬間が「前回」として出る
- **初回は何も出さない。** 記録が空の状態で「前回」を出しようがない。2回目から出る
- **記録の更新を entrypoint が行う。** 機能側は記録の保存場所を知らない。`advanceRecord` は次に保存すべき値を返すだけの純粋な計算にする
- **設定を持たない。** 仕様書に設定項目が無い。表示の有無も切り替えない
- **モジュール名を `lastAccess` にする。** 仕様書の名前は「最終ログイン時刻」ですが、実際に扱うのはアクセス時刻で、名前を合わせると中身と食い違う
