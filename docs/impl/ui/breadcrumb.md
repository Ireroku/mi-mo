# breadcrumb モジュール

## 概要

ページ上部のパンくずリストを、階層を追いやすい見た目へ整える。文字を大きくし、現在地とリンクを描き分ける。要素は差し替えず CSS だけを当てる。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — パンくずのセレクタと、現在地が `span` になる構造。「リンクの色」節に配色の実測値
- 参考: [`../coursePage/sectionToggleDesign.md`](../coursePage/sectionToggleDesign.md) — 既存要素へ CSS だけを当てる機能の形

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/ui/breadcrumb.ts` | CSS の組み立て |
| `src/entrypoints/early.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/ui/breadcrumb.ts
export function applyBreadcrumb(): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。設定を持たないため `await` は要りません。

```ts
// src/entrypoints/early.content.ts
import { applyBreadcrumb } from "@/features/ui/breadcrumb";

applyBreadcrumb();
```

## 処理の流れ

1. 次の CSS 文字列を組み立てる
2. id に `mimo-ui-breadcrumb` を指定して `applyStyleSheet` へ渡す

```css
#page-header .breadcrumb {
  font-size: 0.9em;
  align-items: center;
}

#page-header .breadcrumb-item > a {
  color: var(--primary, #0f6cbf);
  text-decoration: none;
}

#page-header .breadcrumb-item > a:hover {
  text-decoration: underline;
}

#page-header .breadcrumb-item > span {
  font-weight: 600;
  color: inherit;
}
```

## 決めごと

- **区切り記号を変えない。** Bootstrap は版によって区切りの実装が違い（`::before` の `content` を直接持つ形と、`--bs-breadcrumb-divider` を見る形）、三重大の Moodle がどちらかを確かめられていない。触れば片方では効かず、もう片方では二重に出る
- **現在地（`span`）を太字にし、リンク（`a`）を色で区別する。** 標準はどちらも同じ見た目で、今どこにいるかが読み取れない
- **現在地の文字色に `inherit` を使う。** 本文色にあたる CSS 変数が Moodle 側にあるか確かめられていない。親から継ぐ形なら、テーマが変わっても浮かない
- **ページ種別で絞らない。** パンくずはコースページ以外にも出る。`#page-header` の中にあることだけを条件にする
- **要素を差し替えない。** リンク先も階層もサーバー側が組み立てており、こちらが作り直す理由が無い
- **設定を持たない。** 仕様書（[`../../features/course-page/breadcrumb.md`](../../features/course-page/breadcrumb.md)）に設定項目が無い
