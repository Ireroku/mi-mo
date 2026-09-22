# menu logo モジュール

## 概要

上部メニューと左ドロワーに出る Moodle のロゴを隠す。PC 表示とモバイル表示で置かれている場所が違うため、両方を対象にする。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 資料: [`../../moodle/navbar.md`](../../moodle/navbar.md) — PC 表示のブランドリンクと、ドロワーヘッダのロゴ
- 参考: [`./navbar.md`](./navbar.md) — 同じメニューを対象にするが、あちらは項目をテキストで照合するため JS が要る

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/menu/logo.ts` | 設定の型と CSS の組み立て |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/early.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/menu/logo.ts
export interface MenuLogoConfig {
  hidden: boolean;
}

export function applyMenuLogo(config: MenuLogoConfig): void;
```

設定の定義:

```ts
// src/utils/settings.ts
export const menuLogoSetting = storage.defineItem<MenuLogoConfig>(
  "local:menu.logo",
  { fallback: { hidden: false } },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の2行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/early.content.ts
import { applyMenuLogo } from "@/features/menu/logo";
import { menuLogoSetting } from "@/utils/settings";

const config = await menuLogoSetting.getValue();
applyMenuLogo(config);
```

## 処理の流れ

1. `config.hidden` が false の場合、空文字を `applyStyleSheet` へ渡して適用を解除する
2. true の場合、次の CSS を `applyStyleSheet` へ渡す

id は `mimo-menu-logo` を使う。

```css
nav.navbar a.navbar-brand,
.drawerheader img.logo {
  display: none !important;
}
```

## 決めごと

- **PC 表示はブランドリンク（`a.navbar-brand`）ごと隠す。** ロゴ画像だけを消すと、リンクの当たり判定だけが残り、押せる空白ができる
- **ドロワー側は画像（`img.logo`）だけを隠す。** `.drawerheader` にはドロワーを閉じるボタンも入っており、ヘッダごと消すと閉じられなくなる
- **ホームへ戻る手段が減る点を許容する。** ブランドリンクはサイトのトップへの導線ですが、上部メニューに Home の項目が別にある
- **既定では隠さない。** ロゴはページの識別に役立つ場面があり、消えていることに気付きにくい。隠したい人が選ぶ形にする
- **[`./navbar.md`](./navbar.md) の項目削除の仕組みに乗せない。** あちらは項目名を文字で照合するため JS が要る。ロゴはセレクタで一意に取れるため、CSS だけで済む
- **ページ種別で絞らない。** メニューは全ページに出る
