# カウントダウンバッジ

## 概要

指定した時刻までの残り時間を、ナビゲーションメニューに表示する。対象を複数並べられる。残り時間の長さに応じて、表示の粒度が4段階で切り替わる。

## 関連

- 使う: [`clock.md`](./clock.md) — `startClockTicker` でタイマーを回す
- 参考: [`navbar.md`](./navbar.md) — 同じナビゲーションメニューを対象にするが、あちらは実DOMの属性操作、こちらは Shadow DOM への注入
- 資料: [`docs/moodle/navbar.md`](../../moodle/navbar.md) — マウント先のアンカー要素

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/menu/countdownBadge.logic.ts` | 残り時間の計算と書式化 |
| `src/features/menu/countdownBadge.svelte` | 表示 |
| `src/features/menu/index.ts` | 対象の定義と Shadow DOM へのマウント |

## インターフェース

```ts
// countdownBadge.logic.ts
export interface CountdownTarget {
  id: string;
  label: string;
  getTargetTime: () => Date;
}

export const COUNTDOWN_ENDED_LABEL = "終了しました";

export function formatRemaining(remainingMs: number): string;
export function describeCountdown(
  target: CountdownTarget,
  now?: Date,
): string;
```

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

### 残り時間の書式

`formatRemaining` が4段階で整形する。境界はすべて「以下」で、その値自体を含む。

| 残り | 出力例 | 上位が0の場合 |
|---|---|---|
| 0以下 | `終了しました` | — |
| 15分以下 | `12分34秒` | `34秒` |
| 24時間以下 | `3時間45分` | `45分` |
| 7日以下 | `2日と5時間` | `2日` |
| 7日超 | `10日` | — |

### マウント

`index.ts` の `initMenuBadges` が `createShadowRootUi` で差し込む。

| 設定 | 値 |
|---|---|
| `name` | `mimo-countdown-badge` |
| `position` | `inline` |
| `anchor` | `#usernavigation` |
| `append` | `before` |

## 決めごと

- **`getTargetTime` を値ではなく関数として持つ。** 固定の日時（試験日）と、その場で計算する値（次の時限の開始時刻）を同じ形で扱えるようにするため
- **目標時刻を過ぎたら、非表示にせず「終了しました」と表示する。** 消えてしまうと、設定を間違えたのか終わったのかを区別できない
- **境界値はすべて「以下」の側へ含める。** 残りちょうど15分なら秒表示にする
- **上位の単位が0の時は省く。** 「0分34秒」ではなく「34秒」と出す
- **表示が分単位や日単位でも、タイマーは1秒ごとに回す。** 粒度が切り替わる瞬間（残りが15分を切るなど）を取りこぼさないため
- **スタイルは生CSSで書く。** Shadow DOM 内にマウントするため Tailwind のユーティリティが届かない
- **クラス名には `mimo-` 接頭辞を付ける。** Moodle 側との衝突を避けるため
