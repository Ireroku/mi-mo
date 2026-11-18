# font モジュール

## 概要

Moodle の表示に使うフォントを差し替える。利用者の環境に入っているフォントを名前で指定し、本文だけか画面全体かを選ぶ。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 資料: [`../../features/ui/font.md`](../../features/ui/font.md) — 差し替えたい動機と設定項目
- 参考: [`../README.md`](../README.md) — スタイリングの節。フォントを `global.css` へ同梱しない理由

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/ui/font.ts` | 設定の型と CSS の組み立て |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/early.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/ui/font.ts
export type FontScope = "main" | "all";

export interface FontConfig {
  enabled: boolean;
  family: string;
  scope: FontScope;
}

export function applyFont(config: FontConfig): void;
```

設定の定義:

```ts
// src/utils/settings.ts
export const uiFontSetting = defineSetting<FontConfig>("local:ui.font", {
  fallback: { enabled: false, family: "", scope: "all" },
});
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の2行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/early.content.ts
import { applyFont } from "@/features/ui/font";
import { uiFontSetting } from "@/utils/settings";

const config = await uiFontSetting.getValue();
applyFont(config);
```

## 処理の流れ

1. `config.enabled` が false、または `config.family` が空白だけの場合、空文字を `applyStyleSheet` へ渡して適用を解除する
2. `config.family` から `"`、`\`、改行を取り除き、二重引用符で囲む
3. `scope` に応じたセレクタで CSS を組み立て、`applyStyleSheet` へ渡す。id は `mimo-ui-font`

| `scope` | セレクタ |
|---|---|
| `main` | `#region-main` |
| `all` | `body` |

```css
<セレクタ> {
  font-family: "<取り除いた後の名前>", system-ui, sans-serif !important;
}
```

## 決めごと

- **フォント名から `"`、`\`、改行を取り除いてから引用符で囲む。** 設定の値をそのまま CSS へ入れると、`;` や `}` を含む値で任意の宣言を差し込める。引用符の中へ閉じ込めたうえで、閉じるための文字を落とす
- **フォントを同梱せず、利用者の環境にある名前を指定する。** `@fontsource-variable/*` を読み込むと、woff2 が base64 で CSS へ埋め込まれ、content script の CSS が 5.85 kB から 888 kB へ膨らむ。外部の配信元から読む形も、拡張機能が Moodle を開くたびに外部へ接続することになる
- **`body` か `#region-main` にだけ当て、`*` を使わない。** 継承で子へ伝わる。`*` に当てると、アイコンフォント（Font Awesome など）が自前で指定している `font-family` まで上書きし、アイコンが文字化けする
- **`!important` を付ける。** Moodle のテーマが `body` へ直接指定しているため、付けないと効かない。子要素が自分で指定しているもの（アイコン）はそちらが勝つため、巻き込まない
- **フォールバックに `system-ui, sans-serif` を添える。** 指定した名前が環境に無い場合、既定の見た目へ戻る
- **`all` 以外の値はすべて `#region-main` に当てる。** 保存された値が想定外の場合に、影響の小さい側へ倒す
- **`main` は `#region-main` を指す。** 本文にあたる領域で、上部メニューやドロワーは含まない
- **既定は無効にする。** 名前が空のまま有効にしても何も起きず、設定した覚えのない見た目の変化が起きる方の害が大きい
- **どのフォントが使えるかを列挙しない。** 環境にあるフォントを調べる API は対応するブラウザが限られ、利用者への確認も要る。設定画面では名前を打ち込む形にし、当たったかどうかは見た目で分かる
