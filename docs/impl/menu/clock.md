# 時計バッジ

## 概要

Moodle のナビゲーションメニューに現在時刻を表示する。時刻・日付・曜日・時限のそれぞれについて表示するかを設定で切り替える。Svelte コンポーネントを Shadow DOM へマウントして描画する。

## 関連

- 参考: [`navbar.md`](./navbar.md) — 同じナビゲーションメニューを対象にするが、あちらは実DOMの属性操作、こちらは Shadow DOM への注入
- 参考: [`countdownBadge.md`](./countdownBadge.md) — `startClockTicker` を共有する。タイマーの仕様を変える時は両方へ影響する
- 資料: [`docs/moodle/navbar.md`](../../moodle/navbar.md) — マウント先のアンカー要素
- 使う: [`../utils/settings.md`](../utils/settings.md) — 設定の取得。参照するのは entrypoint のみで、機能側は参照しない
- 使う: [`../utils/periods.md`](../utils/periods.md) — `PeriodSlot` の型と、時刻から時限を引く計算

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/menu/clock.logic.ts` | 書式化、時限判定、自己補正タイマー |
| `src/features/menu/clock.svelte` | 表示 |
| `src/features/menu/index.ts` | 設定を受け取り、バッジを Shadow DOM へマウントする |
| `src/entrypoints/shared.content.ts` | 設定を読み、`initMenuBadges` へ渡す |

## インターフェース

```ts
// clock.logic.ts
export interface ClockConfig {
  showSeconds?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showPeriod?: boolean;
}

export type ClockGranularity = "second" | "minute";

export function formatTime(date: Date, showSeconds: boolean): string;
export function formatDate(date: Date): string;
export function formatWeekday(date: Date): string;
export function startClockTicker(
  onTick: (now: Date) => void,
  granularity?: ClockGranularity,
): () => void;
```

`PeriodSlot` と `findCurrentPeriod`・`findNextPeriodStart` は [`../utils/periods.md`](../utils/periods.md) から import する。時限表は時計・カウントダウン・時間割の3つが共有するため、時計の持ち物にしない。

```ts
// clock.svelte の Props
interface Props {
  config: ClockConfig;
  periodTable: PeriodSlot[];
}
```

`startClockTicker` の戻り値はクリーンアップ関数。タイマーの破棄とイベントリスナーの解除を行う。

```ts
// index.ts
export interface MenuBadgesConfig {
  clock: ClockConfig;
  countdowns: CountdownConfig[];
}

export async function initMenuBadges(
  ctx: ContentScriptContext,
  config: MenuBadgesConfig,
  periods: PeriodSlot[],
): Promise<void>;
```

`MenuBadgesConfig` は時計とカウントダウンの両方の設定を持つ。`CountdownConfig` は [`countdownBadge.md`](./countdownBadge.md) が定義する。すべて JSON へ変換できる形にしてあり、そのまま storage へ保存できる。

呼び出し側（`src/entrypoints/shared.content.ts`）での使い方:

```ts
const [badgesConfig, periodTable] = await Promise.all([
  menuBadgesSetting.getValue(),
  periodTableSetting.getValue(),
]);
await initMenuBadges(ctx, badgesConfig, periodTable.periods);
```

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
- **時限まわりの計算は [`../utils/periods.md`](../utils/periods.md) に任せる。** ソート済みを前提とする理由や、当日に残りが無い場合の扱いはあちらが持つ
- **時刻を主役にし、日付と曜日は `text-xs text-muted-foreground` で落とす。** 4つの情報を同じ大きさで並べると、どれを見ればよいか判断できなくなる
- **時限は shadcn の `Badge`（`variant="secondary"`）で囲む。** 時刻や日付と違い、現在どの枠にいるかという別種の情報のため。追加は `pnpm dlx shadcn-svelte@latest add badge -y`
- **数字には `tabular-nums` を当てる。** 桁ごとに幅が変わると、1秒ごとに横幅が揺れる
- **ルート要素へ `font-sans` を明示する。** `createShadowRootUi` が `:host{all:initial}` でリセットするため、指定しないとブラウザ既定のフォントに落ちる
- **設定は entrypoint が読み、`initMenuBadges` が引数で受け取る。** このモジュールは設定の保存場所も形式も参照しない
- **`initMenuBadges` は受け取った `periods` を1度だけ `sortPeriodsByStart` に通し、以降はソート済みのものを渡す。** 設定から来る時限表は順序が保証されず、`findNextPeriodStart` は1秒ごとに呼ばれるため内部でソートしない
- **バッジを差し込んだ後、次の描画フレームで `window` へ `resize` を1度送る。** Moodle は上部メニューに収まる項目数を `resize` の時にだけ計算する。バッジで幅が減った分を反映させないと、項目が2段に折り返す。実機で確認済み
- **時限表を `MenuBadgesConfig` に含めず、別の引数で受け取る。** 時間割も同じ表を使うため、バッジの設定の一部にすると時間割がバッジの設定を読むことになる
