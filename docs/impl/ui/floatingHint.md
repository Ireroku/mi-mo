# floatingHint モジュール

## 概要

画面右下に重なって出るヒントボタンを隠す。全ページに出る要素のため、ページ種別で絞らない。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 資料: [`../../moodle/common.md`](../../moodle/common.md) — ボタンのセレクタと、親のフッターとの関係
- 参考: [`../home/hideElements.md`](../home/hideElements.md) — 無効時に空文字を渡して適用を解除する書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/ui/floatingHint.ts` | 設定の型と CSS の組み立て |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/early.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/ui/floatingHint.ts
export interface FloatingHintConfig {
  hidden: boolean;
}

export function applyFloatingHint(config: FloatingHintConfig): void;
```

設定の定義:

```ts
// src/utils/settings.ts
import type { FloatingHintConfig } from "@/features/ui/floatingHint";

export const uiFloatingHintSetting = defineSetting<FloatingHintConfig>(
  "local:ui.floatingHint",
  { fallback: { hidden: true } },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の2行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/early.content.ts
import { applyFloatingHint } from "@/features/ui/floatingHint";
import { uiFloatingHintSetting } from "@/utils/settings";

const config = await uiFloatingHintSetting.getValue();
applyFloatingHint(config);
```

## 処理の流れ

1. `config.hidden` が false の場合、空文字を `applyStyleSheet` へ渡して適用を解除する
2. true の場合、次の CSS を `applyStyleSheet` へ渡す

id は `mimo-ui-floating-hint` を使う。

```css
#page-footer .btn-footer-popover {
  display: none !important;
}
```

## 決めごと

- **ボタンだけを隠し、親の `footer#page-footer` は残す。** ボタンが消えればポップオーバーを開く手段が無くなる。フッターごと消すと、そこに置かれた他の要素まで巻き込む
- **`data-action="footer-popover"` ではなく `.btn-footer-popover` で指定する。** どちらもこのボタンに固有ですが、クラスの方がセレクタとして短く読める
- **`#page-footer` で祖先を絞る。** クラス単独でも採取時点では1件でしたが、フッターの中にあることを示しておくと、同名のクラスが他所へ増えた時に巻き込まない
- **ページ種別で絞らない。** 全ページに出る要素のため、`body.pagelayout-*` を先頭に付けない
- **既定で隠す。** 仕様書が「一度読めば二度と使わない」「そもそも一度も読まない人が大半」としており、隠れている状態を既定にする
