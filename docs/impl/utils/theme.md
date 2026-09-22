# theme モジュール

## 概要

OS のカラースキームを見て、ルート要素へ `dark` クラスを付け外しする。shadcn のテーマ変数がこのクラスで切り替わるため、拡張機能自身の画面（ポップアップと設定ページ）はこれを呼ばないと常にライトのまま表示される。

## 関連

- 資料: [`../../../src/assets/global.css`](../../../src/assets/global.css) — `.dark` で切り替わるテーマ変数の定義と、`@custom-variant dark (&:is(.dark *))` の宣言

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/theme.ts` | カラースキームの検出とクラスの付け外し |

## インターフェース

```ts
// src/utils/theme.ts
export function syncColorScheme(): void;
```

## 処理の流れ

1. `matchMedia("(prefers-color-scheme: dark)")` を取る
2. `matches` の値で `document.documentElement.classList.toggle("dark", matches)` を呼ぶ
3. 同じ `MediaQueryList` の `change` を購読し、切り替わるたびに 2 を繰り返す

## 決めごと

- **`prefers-color-scheme` のメディアクエリではなくクラスで切り替える。** `global.css` の `@custom-variant dark (&:is(.dark *))` がクラスを見る形で宣言されており、shadcn のコンポーネントもそれに従う
- **付け外しの対象は `document.documentElement`。** `body` に付けると、`:root` に定義した変数を上書きできない
- **ライト・ダーク・自動を選ぶ設定は作らない。** [`../../features/ui/settings.md`](../../features/ui/settings.md) に項目が無い。OS の設定に従うだけにとどめる
- **content script からは呼ばない。** Moodle のページは Moodle 自身のテーマに従う。拡張機能が差し込む UI の配色を Moodle と食い違わせないため、呼ぶのは拡張機能自身の画面だけ
- **購読の解除手段を用意しない。** 呼ぶのはページの寿命と同じ長さで生きる画面だけで、解除する場面が無い
