# graphemes モジュール

## 概要

文字列を書記素（見た目の1文字）の単位で数え、区切り、詰める。時計の時限の名前とカウントダウンのラベルが、同じ数え方で文字数を決めるために使う。

## 関連

- 使う: [`../menu/clock.md`](../menu/clock.md) — 時限の名前を縦書きの列に区切る
- 使う: [`../menu/countdownBadge.md`](../menu/countdownBadge.md) — ラベルを行に区切る

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/graphemes.ts` | 書記素での分割、区切り、切り詰め |
| `src/utils/graphemes.test.ts` | 単体テスト |

## インターフェース

```ts
// src/utils/graphemes.ts
export const ELLIPSIS = "…";

export function splitGraphemes(text: string): string[];
export function chunkGraphemes(text: string, size: number): string[];
export function truncateGraphemes(text: string, max: number): string;
```

## 処理の流れ

1. `splitGraphemes` は `Intl.Segmenter` の `granularity: "grapheme"` で分ける。`Intl.Segmenter` が無い環境ではコードポイント単位で分ける
2. `chunkGraphemes` は `size` 文字ずつに区切った配列を返す。空文字では空の配列を返す
3. `truncateGraphemes` は `max` 文字を超える場合、先頭の `max − 1` 文字に「…」を足して返す。`max` 文字以内ならそのまま返す

| 関数 | 入力 | 結果 |
|---|---|---|
| `chunkGraphemes` | `昼休み`、2 | `["昼休", "み"]` |
| `truncateGraphemes` | `12345`、4 | `123…` |

## 決めごと

- **文字数は書記素で数える。** 濁点の結合文字や絵文字の途中で切ると、文字が壊れて表示される
- **Moodle に依存しないため `src/utils/` に置く。** 時計とカウントダウンの両方が使い、どちらの持ち物でもない
- **切り詰めた結果も `max` 文字に収める。** 「…」を含めた長さで上限を守ると、呼び出し側が幅を見積もれる
