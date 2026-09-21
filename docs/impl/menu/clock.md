# 時計バッジ

## 概要

Moodle のナビゲーションメニューに現在時刻を表示する。時刻・日付・曜日・時限のそれぞれについて表示するかを設定で切り替える。Svelte コンポーネントを Shadow DOM へマウントして描画する。

## 関連

- 参考: [`navbar.md`](./navbar.md) — 同じナビゲーションメニューを対象にするが、あちらは実DOMの属性操作、こちらは Shadow DOM への注入
- 参考: [`countdownBadge.md`](./countdownBadge.md) — `startClockTicker` を共有する。タイマーの仕様を変える時は両方へ影響する
- 資料: [`docs/moodle/navbar.md`](../../moodle/navbar.md) — マウント先のアンカー要素

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/menu/clock.logic.ts` | 書式化、時限判定、自己補正タイマー |
| `src/features/menu/clock.svelte` | 表示 |
| `src/features/menu/index.ts` | 設定の定義と Shadow DOM へのマウント |

## インターフェース

```ts
// clock.logic.ts
export interface ClockConfig {
  showSeconds?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showPeriod?: boolean;
}

export interface PeriodSlot {
  period: number;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export type ClockGranularity = "second" | "minute";

export function formatTime(date: Date, showSeconds: boolean): string;
export function formatDate(date: Date): string;
export function formatWeekday(date: Date): string;
export function findCurrentPeriod(
  date: Date,
  periods: PeriodSlot[],
): PeriodSlot | undefined;
export function findNextPeriodStart(
  date: Date,
  sortedPeriods: PeriodSlot[],
): Date | undefined;
export function startClockTicker(
  onTick: (now: Date) => void,
  granularity?: ClockGranularity,
): () => void;
```

```ts
// clock.svelte の Props
interface Props {
  config: ClockConfig;
  periodTable: PeriodSlot[];
}
```

`startClockTicker` の戻り値はクリーンアップ関数。タイマーの破棄とイベントリスナーの解除を行う。

## 処理の流れ

### 表示の更新

1. `clock.svelte` が `$effect` の中で `startClockTicker` を呼び、戻り値のクリーンアップ関数をそのまま返す。コンポーネントの破棄時にタイマーが止まる
2. 粒度は `config.showSeconds` が true なら `"second"`、false なら `"minute"`
3. tick のたびに `now` を更新する。表示する値は毎回 `now` から計算し直す

### startClockTicker

1. まず1回 `onTick` を呼ぶ
2. 現在時刻から次の秒（または分）境界までの残りミリ秒を求め、`setTimeout` で次の tick を予約する
3. `visibilitychange` を監視し、タブが表示状態へ戻ったら予約中のタイマーを破棄して即座に tick し直す
4. クリーンアップ関数を返す

### 書式

| 呼び出し | 出力例 |
|---|---|
| `formatTime(date, false)` | `09:05` |
| `formatTime(date, true)` | `09:05:30` |
| `formatDate(date)` | `2026/9/21` |
| `formatWeekday(date)` | `日曜日` |

時と分と秒はゼロ埋めする。年月日はゼロ埋めしない。

### 時限の判定

1. `findCurrentPeriod` が `PeriodSlot[]` を走査し、現在時刻が `start` 以上 `end` 未満に収まる枠を返す
2. 該当がなければ `undefined` を返す。表示は「時間外」

### マウント

`index.ts` の `initMenuBadges` が `createShadowRootUi` で差し込む。

| 設定 | 値 |
|---|---|
| `name` | `mimo-clock-badge` |
| `position` | `inline` |
| `anchor` | `#usernavigation` |
| `append` | `before` |

## 決めごと

- **`setInterval` を使わず、`setTimeout` で次の境界までを毎回計算し直す。** `setInterval` は誤差が累積するため
- **`visibilitychange` で表示へ戻った時点に再同期する。** バックグラウンドタブではタイマーが間引かれるため。ただし表示値は毎回 `new Date()` から計算するので、遅れるのは更新のタイミングだけで、表示内容そのものが狂うことはない
- **`findNextPeriodStart` は `sortedPeriods` がソート済みであることを前提とする。** カウントダウンから1秒ごとに呼ばれるため、内部でソートしない。ソートの責任は呼び出し側にある
- **当日に残りの時限が無い場合、`findNextPeriodStart` は翌日の最初の時限を返す。** `undefined` を返すのは時限表が空の時だけ
- **時限の判定は `start` 以上 `end` 未満。** 終了時刻ちょうどは、その枠に含めない
- **スタイルは生CSSで書く。** Shadow DOM 内にマウントするため Tailwind のユーティリティが届かない
- **クラス名には `mimo-` 接頭辞を付ける。** Moodle 側との衝突を避けるため
