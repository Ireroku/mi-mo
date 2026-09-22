# autoattendStats モジュール

## 概要

右のドロワーに隠れている出欠のブロックから、出席回数と出席率を読み取り、コースページの上部へ常に見える形で出す。ドロワーを開く操作を挟まずに現状が分かるようにする。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — 出欠ブロックのセレクタと、中身がテキストで並ぶ構造
- 資料: [`../../moodle/drawer.md`](../../moodle/drawer.md) — ドロワーが閉じていても中身が DOM にある点
- 参考: [`./autoattendButton.md`](./autoattendButton.md) — 同じ autoattend を対象にする機能

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/autoattendStats.ts` | 設定の型、ブロックの読み取り、差し込み |
| `src/features/coursePage/AutoattendStats.svelte` | 出席状況の描画 |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/shared.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/autoattendStats.ts
export interface AttendanceStats {
  present: number;
  late: number;
  earlyLeave: number;
  absent: number;
  rate: number; // 出席率（百分率の数値）
  detailUrl?: string;
}

export interface AutoattendStatsConfig {
  enabled: boolean;
}

export function readAttendanceStats(): AttendanceStats | undefined;

export async function initAutoattendStats(
  ctx: ContentScriptContext,
  config: AutoattendStatsConfig,
): Promise<void>;
```

```ts
// AutoattendStats.svelte の Props
interface Props {
  stats: AttendanceStats;
}
```

設定の定義:

```ts
// src/utils/settings.ts
export const coursePageAutoattendStatsSetting =
  storage.defineItem<AutoattendStatsConfig>(
    "local:coursePage.autoattendStats",
    { fallback: { enabled: true } },
  );
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initAutoattendStats } from "@/features/coursePage/autoattendStats";
import { coursePageAutoattendStatsSetting } from "@/utils/settings";

const config = await coursePageAutoattendStatsSetting.getValue();
if (config.enabled) {
  await initAutoattendStats(ctx, config);
}
```

## 処理の流れ

### readAttendanceStats

1. `.block_autoattend .card-text` を探す。無ければ `undefined` を返す
2. `textContent` を改行で分け、各行を `ラベル: 値` の形として読む
3. 次のラベルを拾う。1つでも欠けた場合は `undefined` を返す

| ラベル | 取り出す先 |
|---|---|
| 出席 | `present` |
| 遅刻 | `late` |
| 早退 | `earlyLeave` |
| 欠席 | `absent` |
| 出席率 | `rate` |

4. 数値は全角と半角のどちらでも読めるよう、数字以外を除いてから変換する
5. `.block_autoattend a[href*="/blocks/autoattend/"]` があれば `detailUrl` に入れる

### initAutoattendStats

1. `isCoursePage()` が false なら何もせず戻る
2. `readAttendanceStats()` を呼ぶ。`undefined` なら何もせず戻る
3. `createShadowRootUi` で `AutoattendStats.svelte` をマウントする

| 設定 | 値 |
|---|---|
| `name` | `mimo-autoattend-stats` |
| `position` | `inline` |
| `anchor` | `#region-main .secondary-navigation` |
| `append` | `after` |

### AutoattendStats.svelte

1. 出席率を主役として大きく出す
2. 出席・遅刻・早退・欠席の回数を、shadcn の Badge で小さく並べる
3. `detailUrl` があれば「詳細」のリンクを添える

## 決めごと

- **ブロックの中身をテキストとして読む。** 各項目に専用の要素や属性が無く、`<br>` 区切りのテキストが並ぶだけのため、行ごとに読む以外の方法が無い
- **ラベルが1つでも欠けたら表示しない。** 部分的に読めた値だけを出すと、欠けた項目が0件なのか読み取り失敗なのか区別できない
- **出席率を主役にし、内訳は補助として小さく並べる。** 仕様書が挙げる動機は「あと何回休めるか」で、まず見たいのは率の方
- **出席点と得点率は表示しない。** 仕様書が求めているのは出席回数と出席率で、点数は別の関心にあたる
- **ドロワーの開閉に関係なく読める。** 閉じていても中身は DOM にあり、`show` クラスの有無で見た目が変わるだけ
- **元のブロックを消さない。** 出席点など、こちらが出さない項目がそこにある
- **差し込み先をタブ列（`.secondary-navigation`）の直後にする。** コース名のすぐ下で、コース内容を読み始める前に目に入る。[`./autoattendButton.md`](./autoattendButton.md) の `top` はコース内容の直前で、場所が重ならない
- **`document_idle` で初期化する。** ブロックが描かれた後でなければ読めない
