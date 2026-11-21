# 時計バッジ

## 概要

Moodle のナビゲーションメニューに現在時刻を表示する。左に時限を縦書きで置き、その右に時刻と日付の二段を積む。秒・12時間表記・日付・年・曜日・時限のそれぞれを設定で切り替える。Svelte コンポーネントを Shadow DOM へマウントして描画する。

## 関連

- 参考: [`navbar.md`](./navbar.md) — 同じナビゲーションメニューを対象にするが、あちらは実DOMの属性操作、こちらは Shadow DOM への注入
- 参考: [`countdownBadge.md`](./countdownBadge.md) — `startClockTicker` を共有する。タイマーの仕様を変える時は両方へ影響する
- 資料: [`docs/moodle/navbar.md`](../../moodle/navbar.md) — マウント先のアンカー要素
- 使う: [`../utils/settings.md`](../utils/settings.md) — 設定の取得。参照するのは entrypoint のみで、機能側は参照しない
- 使う: [`../utils/periods.md`](../utils/periods.md) — `PeriodSlot` の型と、時刻から時限を引く計算
- 使う: [`../utils/graphemes.md`](../utils/graphemes.md) — 時限の名前を書記素で数えて切る
- 使う: [`../utils/mountShadowUi.md`](../utils/mountShadowUi.md) — Svelte コンポーネントを Shadow DOM で差し込む共通処理
- 参考: [`drawerClock.md`](./drawerClock.md) — 隠れた部分の見張りと、ドロワーのブロック。`layout` と `watch` の使い道

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
  showYear?: boolean;
  showDate?: boolean;
  showWeekday?: boolean;
  showPeriod?: boolean;
  hour12?: boolean;
}

export type ClockGranularity = "second" | "minute";

export function formatTime(date: Date, config: ClockConfig): string;
export function formatDate(date: Date, config: ClockConfig): string;

export const PERIOD_CHARS_PER_COLUMN = 2;
export const PERIOD_MAX_COLUMNS = 2;
export function formatPeriodName(name: string): string;
export function startClockTicker(
  onTick: (now: Date) => void,
  granularity?: ClockGranularity,
): () => void;
```

`PeriodSlot` と `findCurrentPeriod`・`periodName` は [`../utils/periods.md`](../utils/periods.md) から import する。時限表は時計・カウントダウン・時間割の3つが共有するため、時計の持ち物にしない。

```ts
// clock.svelte の Props
interface Props {
  config: ClockConfig;
  periodTable: PeriodSlot[];
  // menu は狭い画面で部分を消す。drawer は消さずにすべて出す。既定は menu
  layout?: "menu" | "drawer";
  // 狭い画面で消える部分（鍵は clock・period・date）を見張る attachment を返す
  watch?: (part: string) => Attachment;
}
```

`startClockTicker` の戻り値はクリーンアップ関数。タイマーの破棄とイベントリスナーの解除を行う。

```ts
// index.ts
export interface MenuBadgesConfig {
  showClock: boolean; // false の時は時計を差し込まない
  clock: ClockConfig;
  countdowns: CountdownConfig[];
  thresholds: CountdownThresholds;
}

export async function initMenuBadges(
  ctx: ContentScriptContext,
  config: MenuBadgesConfig,
  periods: PeriodSlot[],
  timetable: TimetableConfig,
  drawer: boolean,
): Promise<void>;
```

`drawer` は右のドロワーを隠す設定が入っていない時に true を渡す。true でページにドロワーがあれば、メニューで隠れた時計とカウントダウンをドロワーのブロックへ移す。扱いは [`drawerClock.md`](./drawerClock.md) にある。

`timetable` はカウントダウンを時間割に合わせるかどうかの判定にだけ使う。時計は参照しない。扱いは [`countdownBadge.md`](./countdownBadge.md) にある。

`MenuBadgesConfig` は時計とカウントダウンの両方の設定を持つ。`CountdownConfig` と `CountdownThresholds` は [`countdownBadge.md`](./countdownBadge.md) が定義する。すべて JSON へ変換できる形にしてあり、そのまま storage へ保存できる。

呼び出し側（`src/entrypoints/shared.content.ts`）での使い方:

```ts
await initMenuBadges(
  ctx,
  badgesConfig,
  periodTableConfig.periods,
  timetableConfig,
  !quickDrawerConfig.hidden,
);
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

どちらも `Intl.DateTimeFormat("ja-JP", …)` で整形する。`formatDate` は日付（月と日を `numeric`）と曜日（`short`）を別々に整形し、半角の空白でつなぐ。

| 関数 | 設定 | 出力例 |
|---|---|---|
| `formatTime` | なし | `09:05` |
| `formatTime` | `showSeconds` | `09:05:30` |
| `formatTime` | `hour12` | `午前9:05`、`午後2:05` |
| `formatDate` | `showDate` と `showWeekday` | `11/7 土` |
| `formatDate` | 上に加えて `showYear` | `2026/11/7 土` |
| `formatDate` | `showDate` のみ | `11/7` |
| `formatDate` | `showWeekday` のみ | `土` |
| `formatDate` | どちらも無し | 空文字 |

24時間表記では時をゼロ埋めする。12時間表記の時と、月日はゼロ埋めしない。`showYear` は `showDate` が有効な時にだけ効く。

### 表示の配置

ルート要素を横並び（`flex items-center`）にし、左から次の順に置く。

| 位置 | 中身 | 文字 |
|---|---|---|
| 左 | 時限の名前（`formatPeriodName(periodName(slot))`）を縦書き | `text-xs leading-none text-muted-foreground` |
| 右の上段 | 時刻 | `text-sm font-medium` |
| 右の下段 | 日付と曜日 | `text-xs text-muted-foreground` |

1. 時限は `writing-mode: vertical-rl` と `text-orientation: upright` で縦に書く。名前は1つのテキストのまま置き、列の区切りは `formatPeriodName` が入れる改行で示す（`whitespace-pre`）。全文は `title` 属性で読める
2. 時刻との間隔は時限の要素の `mr-1.5` で取る。時限が無い時は要素を置かず、幅を残さない
3. `formatDate` が空文字なら下段を置かない

狭い画面では、次の順に消す。カウントダウンは画面の幅ではなく、メニューの残りの幅で消える（[`countdownBadge.md`](./countdownBadge.md)）。768px 未満では Moodle のメニューがハンバーガーに入って幅が空くため、時限が消えてもカウントダウンは出ていることがある。

| 画面の幅 | 消すもの |
|---|---|
| `md`（768px）未満 | 時限 |
| `sm`（640px）未満 | 上に加えて、日付 |
| 360px 未満 | 時計全体 |

消える条件は `layout` が `menu` の時だけ当てる。`drawer` ではどの段も消さず、ルートの高さ（`h-full`）と左右の余白（`px-3`）も外す。`watch` を受け取った時は、ルートと時限と日付の要素へ `{@attach watch(鍵)}` を付ける。消えた部分をドロワーへ移す流れは [`drawerClock.md`](./drawerClock.md) にある。

### formatPeriodName

1. 名前を書記素で数え、`PERIOD_CHARS_PER_COLUMN × PERIOD_MAX_COLUMNS`（4文字）を超える場合、先頭3文字に「…」を足す（`truncateGraphemes`）
2. 2文字ずつに区切り（`chunkGraphemes`）、改行でつなぐ

| 名前 | 結果 |
|---|---|
| `三限` | `三限` |
| `昼休み` | `昼休` と `み` の2列 |
| `1-2限目` | `1-` と `2…` の2列 |

### 時限の判定

1. `findCurrentPeriod` が `PeriodSlot[]` を走査し、現在時刻が `start` 以上 `end` 未満に収まる枠を返す
2. 該当がなければ `undefined` を返す。時限は表示しない

### マウント

`index.ts` の `initMenuBadges` が [`mountShadowUi`](../utils/mountShadowUi.md) で差し込む。`#usernavigation` が無いページでは何もしない。

1. `#usernavigation` の直前へ `div.mimo-countdown-slot`（カウントダウンの置き場所）を置く。`ctx.onInvalidated` で取り除く
2. カウントダウンを置き場所の中へ差し込む
3. `config.showClock` が true の場合だけ、時計を `#usernavigation` の直前へ差し込む。false の時はドロワーにも時計が出ない。ドロワーはメニューの時計が隠れた時だけ時計を出すため
4. `drawer` が true でドロワーがあれば、ドロワーのブロックを差し込む（[`drawerClock.md`](./drawerClock.md)）

| 設定 | カウントダウン | 時計 |
|---|---|---|
| `name` | `mimo-countdown-badge` | `mimo-clock-badge` |
| `position` | `inline` | `inline` |
| `anchor` | 置き場所 | `#usernavigation` |
| `append` | `last` | `before` |

並びは置き場所（カウントダウン）、時計、Moodle の通知の順になる。`applyStyleSheet` で次のスタイルを当てる。Moodle は `#usernavigation` を `ms-auto`（`!important` 付き）で右へ寄せている。

| 対象 | 値 |
|---|---|
| `nav.navbar .mimo-countdown-slot` | `flex: 1 1 0; min-width: 0; overflow: hidden; align-self: stretch; display: flex; flex-direction: column; justify-content: center` |
| `nav.navbar #usernavigation` | `margin-left: 0 !important` |

## 決めごと

- **`setInterval` を使わず、`setTimeout` で次の境界までを毎回計算し直す。** `setInterval` は誤差が累積するため
- **`visibilitychange` で表示へ戻った時点に再同期する。** バックグラウンドタブではタイマーが間引かれるため。ただし表示値は毎回 `new Date()` から計算するので、遅れるのは更新のタイミングだけで、表示内容そのものが狂うことはない
- **時限まわりの計算は [`../utils/periods.md`](../utils/periods.md) に任せる。** ソート済みを前提とする理由や、当日に残りが無い場合の扱いはあちらが持つ
- **時刻を主役にし、日付と曜日と時限は `text-xs text-muted-foreground` で落とす。** 4つの情報を同じ大きさで並べると、どれを見ればよいか判断できなくなる
- **時刻と日付は一段に並べず、二段に積む。** 上部メニューの幅は Moodle の項目と分け合う。二段にすると、幅は長い方の段（多くは日付）だけで決まる
- **時限は左に縦書きで置く。** 二段の高さを使うため、横に並べるより幅を取らない。縦書きの1列は2文字までにし、2列を超える名前は「…」で切る
- **時限の名前は1つのテキストのまま縦に書き、1文字ずつの要素に分けない。** 要素に分けると、読み上げで1文字ずつ区切られる
- **日付は `11/7 土` の形にする。** `11月7日(土)` より幅を取らない
- **時限を枠で囲まず、文字だけにする。** 大きさと色の差で時刻との区別が付くため、枠は区別を増やさない
- **授業時間の外では「時間外」と書かず、時限を出さない。** 時限が無いこと自体が、時間外であることを伝える
- **整形を `Intl.DateTimeFormat` に任せる。** 曜日の名前、午前・午後、桁埋めを自前で持たずに済む
- **日付と曜日を別々に整形してつなぐ。** 1つの `Intl.DateTimeFormat` で両方を出すと、曜日の括弧と区切りが環境の書式に従い、`11/7(土)` のように詰まる
- **秒・年・12時間表記の既定はオフにする。** 幅を使う割に、要る人が少ない。保存済みの設定を持つ利用者には、既定の変更は及ばない
- **数字には `tabular-nums` を当てる。** 桁ごとに幅が変わると、1秒ごとに横幅が揺れる
- **ルート要素へ `font-sans` を明示する。** `createShadowRootUi` が `:host{all:initial}` でリセットするため、指定しないとブラウザ既定のフォントに落ちる
- **設定は entrypoint が読み、`initMenuBadges` が引数で受け取る。** このモジュールは設定の保存場所も形式も参照しない
- **`initMenuBadges` は受け取った `periods` を1度だけ `sortPeriodsByStart` に通し、以降はソート済みのものを渡す。** 設定から来る時限表は順序が保証されず、`findPeriodSegment` は1秒ごとに呼ばれるため内部でソートしない
- **バッジを差し込んだ後、次の描画フレームで `window` へ `resize` を1度送る。** Moodle は上部メニューに収まる項目数を `resize` の時にだけ計算する。バッジで幅が減った分を反映させないと、項目が2段に折り返す。実機で確認済み
- **置き場所を先に置き、カウントダウンと時計を1つずつ差し込む。** 並びを読み込みのたびに変えないため
- **時計を通知の隣に置き、カウントダウンをその左に置く。** 時計は常に出る基準の位置で、カウントダウンは対象の数で幅が変わる。幅の変わる方を外側に置くと、時計の位置が動かない
- **空きは置き場所が伸びて吸い、`#usernavigation` の自動の余白を外す。** 空きを吸う要素が無いと、Moodle の `justify-content: space-between` で空きが分けられ、時計と通知の間が空く
- **置き場所を Shadow DOM の外の要素にし、バッジの host へ外から CSS を当てない。** WXT は host へ `:host{all:initial !important}` を当てるため、外の文書から `margin` や `flex` を指定しても効かない（実機で確認）
- **置き場所はカウントダウンの対象が無くても置く。** 空きを吸う役を兼ねるため
- **時計は狭い画面で時限、日付、時刻の順に消し、カウントダウンはメニューの残りの幅だけで決める。** 2つの消え方を一列の順に揃えない。768px 未満で Moodle のメニューがハンバーガーに入ると幅が空き、空いた場所にカウントダウンを出すほうが役に立つため。 時計は Moodle の利用に直接の関わりが無い補助で、最後に残すのは今の時刻
- **時限表を `MenuBadgesConfig` に含めず、別の引数で受け取る。** 時間割も同じ表を使うため、バッジの設定の一部にすると時間割がバッジの設定を読むことになる
