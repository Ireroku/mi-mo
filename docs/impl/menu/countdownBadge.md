# カウントダウンバッジ

## 概要

指定した時刻までの残り時間を、ナビゲーションメニューに表示する。対象を複数並べられる。残り時間の長さに応じて、表示の粒度が4段階で切り替わる。

## 関連

- 使う: [`clock.md`](./clock.md) — `startClockTicker` でタイマーを回す。`initMenuBadges` の定義もそちらにある
- 使う: [`../utils/periods.md`](../utils/periods.md) — `PeriodSlot` の型と `findNextPeriodStart`
- 使う: [`../utils/settings.md`](../utils/settings.md) — 設定の取得。参照するのは entrypoint のみで、機能側は参照しない
- 参考: [`navbar.md`](./navbar.md) — 同じナビゲーションメニューを対象にするが、あちらは実DOMの属性操作、こちらは Shadow DOM への注入
- 資料: [`docs/moodle/navbar.md`](../../moodle/navbar.md) — マウント先のアンカー要素

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/menu/countdownBadge.logic.ts` | 残り時間の計算と書式化、設定から対象への変換 |
| `src/features/menu/countdownBadge.svelte` | 表示 |
| `src/features/menu/index.ts` | 設定を受け取り、Shadow DOM へマウントする |
| `src/entrypoints/shared.content.ts` | 設定を読み、`initMenuBadges` へ渡す |

## インターフェース

```ts
// countdownBadge.logic.ts
export interface CountdownTarget {
  id: string;
  label: string;
  getTargetTime: () => Date;
}

export type CountdownSource =
  | { kind: "nextPeriod" }
  | { kind: "fixedDate"; at: string };

export interface CountdownConfig {
  id: string;
  label: string;
  source: CountdownSource;
}

export const COUNTDOWN_ENDED_LABEL = "終了しました";

export function formatRemaining(remainingMs: number): string;
export function describeCountdown(
  target: CountdownTarget,
  now?: Date,
): string;
export function buildCountdownTargets(
  configs: CountdownConfig[],
  periods: PeriodSlot[],
): CountdownTarget[];
```

`PeriodSlot` と `findNextPeriodStart` は [`../utils/periods.md`](../utils/periods.md) の `periods.ts` から import する。`fixedDate` の `at` は `new Date()` が解釈できる日時の文字列。設定画面は `datetime-local` の値（`YYYY-MM-DDTHH:MM`、秒とタイムゾーンを持たない形）をそのまま入れる。

```ts
// countdownBadge.svelte の Props
interface Props {
  targets: CountdownTarget[];
}
```

`formatRemaining` は残りミリ秒だけを受け取る純粋関数。`describeCountdown` は `target.getTargetTime()` と `now` の差を取って `formatRemaining` へ渡す。

## 処理の流れ

### 表示の更新

1. `countdownBadge.svelte` が `$effect` の中で `startClockTicker` を粒度 `"second"` で呼ぶ
2. tick のたびに `now` を更新し、各 target について `describeCountdown(target, now)` を計算する
3. `{#each}` のキーには `target.id` を使う

### 表示の配置

1 件を縦に積み、右揃えにする。上段がラベル、下段が残り時間。時計と同じ形になる。

| 画面の幅 | 表示 |
|---|---|
| `xl`（1280px）以上 | すべての対象を、ラベルと残り時間の二段で出す |
| `lg`（1024px）以上 `xl` 未満 | ラベルを消し、残り時間だけを出す |
| `lg` 未満 | 上に加えて、2 件目以降を消す |

ラベルの幅は `8em` を上限とする。超えた分は折り返し、2 行に収まらない分は「…」で切る（`line-clamp-2`）。全文は `title` 属性で読める。残り時間は折り返さない。

### 残り時間の書式

`formatRemaining` が4段階で整形する。境界はすべて「以下」で、その値自体を含む。

| 残り | 出力例 | 上位が0の場合 |
|---|---|---|
| 0以下 | `終了しました` | — |
| 15分以下 | `12分34秒` | `34秒` |
| 24時間以下 | `3時間45分` | `45分` |
| 7日以下 | `2日と5時間` | `2日` |
| 7日超 | `10日` | — |

### buildCountdownTargets

保存できる形の `CountdownConfig[]` を、実行時の `CountdownTarget[]` へ変換する。

1. 各 `CountdownConfig` の `source.kind` を見る
2. `"nextPeriod"` の場合、`getTargetTime` を `() => findNextPeriodStart(new Date(), periods) ?? new Date()` にする
3. `"fixedDate"` の場合、`getTargetTime` を `() => new Date(source.at)` にする
4. `id` と `label` はそのまま引き継ぐ

### マウント

`index.ts` の `initMenuBadges` が、受け取った設定を `buildCountdownTargets` で変換してから `createShadowRootUi` で差し込む。

| 設定 | 値 |
|---|---|
| `name` | `mimo-countdown-badge` |
| `position` | `inline` |
| `anchor` | `#usernavigation` |
| `append` | `before` |

## 決めごと

- **`getTargetTime` を値ではなく関数として持つ。** 固定の日時（試験日）と、その場で計算する値（次の時限の開始時刻）を同じ形で扱えるようにするため
- **保存する形（`CountdownConfig`）と実行時の形（`CountdownTarget`）を分ける。** `getTargetTime` が関数のため、`CountdownTarget` をそのまま storage へ保存できない
- **変換は `initMenuBadges` の内部で行い、entrypoint には出さない。** entrypoint の担当を設定の取得と受け渡しだけに保つため
- **目標時刻を過ぎたら、非表示にせず「終了しました」と表示する。** 消えてしまうと、設定を間違えたのか終わったのかを区別できない
- **境界値はすべて「以下」の側へ含める。** 残りちょうど15分なら秒表示にする
- **上位の単位が0の時は省く。** 「0分34秒」ではなく「34秒」と出す
- **表示が分単位や日単位でも、タイマーは1秒ごとに回す。** 粒度が切り替わる瞬間（残りが15分を切るなど）を取りこぼさないため
- **残り時間を主役にし、ラベルは `text-xs text-muted-foreground` で落とす。** 「次の時限まで」が何のカウントダウンかを示す補助で、読みたいのは残り時間そのもののため
- **ラベルと残り時間を横に並べず、縦に積む。** 横に並べると、ラベルが長いほど際限なく幅を取る。縦に積むと、幅はラベルの上限（`8em`）で止まる
- **ラベルの長さで形を変えず、常に縦に積む。** 対象ごとに形が違うと、並んだ時に揃わない
- **対象どうしは下で揃える。** ラベルが 1 行の対象と 2 行の対象が並んでも、残り時間が同じ高さに並ぶ
- **狭い画面では、ラベル、2 件目以降の順に消す。** 読みたいのは残り時間で、1 件目は利用者が最も上に置いた対象のため
- **譲る条件は画面の幅の区切り（`xl`、`lg`）で決め、メニューの空きを実測しない。** Moodle は上部メニューに収まる項目数を自前で計算する。空きを測って表示を変えると、その計算と互いに影響し合う
- **数字には `tabular-nums` を当てる。** 桁ごとに幅が変わると、1秒ごとに横幅が揺れる
- **ルート要素へ `font-sans` を明示する。** `createShadowRootUi` が `:host{all:initial}` でリセットするため、指定しないとブラウザ既定のフォントに落ちる
