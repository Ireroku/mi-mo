# sectionToggleDesign モジュール

## 概要

コース内容の右上にある「すべてを展開する / すべてを折りたたむ」のリンクを、押せると分かる見た目へ整える。要素は差し替えず、CSS だけを当てる。セクションヘッダーに mi-mo が足すボタン（[`./sectionActions.md`](./sectionActions.md)）も同じクラスを持ち、同じ見た目になる。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — ボタンのセレクタと、2つの span が常に DOM にある点。「リンクの色」節に配色の実測値
- 参考: [`./sectionTitleLink.md`](./sectionTitleLink.md) — 同じページの見た目を CSS だけで直す機能の形

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/sectionToggleDesign.ts` | CSS の組み立て |
| `src/entrypoints/early.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/sectionToggleDesign.ts
export function applySectionToggleDesign(): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。設定を持たないため `await` は要りません。

```ts
// src/entrypoints/early.content.ts
import { applySectionToggleDesign } from "@/features/coursePage/sectionToggleDesign";

applySectionToggleDesign();
```

## 処理の流れ

1. 次の CSS 文字列を組み立てる
2. id に `mimo-course-page-section-toggle` を指定して `applyStyleSheet` へ渡す

```css
body.pagelayout-course :is(.section-collapsemenu, .mimo-section-action) {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--secondary, #ced4da);
  border-radius: 0.375rem;
  color: var(--primary, #0f6cbf);
  font-size: 0.9em;
  text-decoration: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

body.pagelayout-course :is(.section-collapsemenu, .mimo-section-action):hover {
  background-color: rgba(15, 108, 191, 0.08);
  background-color: color-mix(in srgb, var(--primary, #0f6cbf) 8%, transparent);
  border-color: var(--primary, #0f6cbf);
  text-decoration: none;
}

body.pagelayout-course :is(.section-collapsemenu, .mimo-section-action):focus-visible {
  outline: 2px solid var(--primary, #0f6cbf);
  outline-offset: 2px;
}
```

## 決めごと

- **ID（`#collapsesections`）ではなくクラス（`.section-collapsemenu`）へ当て、[`./sectionActions.md`](./sectionActions.md) のボタンのクラス（`SECTION_ACTION_CLASS`）と `:is()` でまとめる。** 1つの規則で両方の見た目が揃う。`#collapsesections` 以外の Moodle の要素がこのクラスを持つかは、実機で確かめていない
- **要素を差し替えず CSS だけを当てる。** このリンクは `data-toggle="toggleall"` で Moodle の JS が制御しており、`aria-controls` に全セクションの内部 ID を持つ。差し替えると一括開閉そのものが動かなくなる
- **shadcn の Button を使わない。** Moodle の DOM へ Svelte を差し込む形になり、既存の開閉動作を引き継げない。見た目だけを CSS で寄せる
- **配色は Moodle の CSS 変数を使い、フォールバックに実測値を添える。** `--primary` と `--secondary` は Boost が `:root` へ出力しており、テーマの色が変わっても追随する
- **hover の背景を2行書く。** 1行目の `rgba` は `color-mix` を解さない環境のための備え。解する環境では2行目が勝つ
- **`collapseall` と `expandall` の2つの span には触らない。** どちらも常に DOM にあり、表示の切り替えは `aria-expanded` を見た Moodle 側の CSS が行う。こちらが表示を操作すると二重に制御することになる
- **`focus-visible` のリングを付ける。** キーボードで辿った時に、どこにいるか分かるようにする
- **設定を持たない。** 仕様書（[`../../features/course-page/section-toggle-design.md`](../../features/course-page/section-toggle-design.md)）に設定項目が無い
