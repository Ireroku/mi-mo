# clickableCard モジュール

## 概要

マイコース一覧のコース1件について、要素内のどこをクリックしてもコースページへ移動できるようにする。コース名リンクの当たり判定を、疑似要素で要素全体へ広げる。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 資料: [`../../moodle/my-courses.md`](../../moodle/my-courses.md) — 3種の表示形式で共通するセレクタ、アクションメニューの位置
- 参考: [`../coursePage/reverseSections.md`](../coursePage/reverseSections.md) — CSS だけで完結する機能の形

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/myCourses/clickableCard.ts` | CSS の組み立て |
| `src/entrypoints/early.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/myCourses/clickableCard.ts
export function applyClickableCard(): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。設定を持たないため `await` は要りません。

```ts
// src/entrypoints/early.content.ts
import { applyClickableCard } from "@/features/myCourses/clickableCard";

applyClickableCard();
```

## 処理の流れ

1. 次の CSS 文字列を組み立てる
2. id に `mimo-my-courses-clickable-card` を指定して `applyStyleSheet` へ渡す

```css
body.pagelayout-mycourses [data-region="course-content"] {
  position: relative;
}

body.pagelayout-mycourses [data-region="course-content"] a.coursename::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
}

body.pagelayout-mycourses [data-region="course-content"] .menu {
  position: relative;
  z-index: 2;
}
```

## 決めごと

- **JS でクラスを付けず、CSS の疑似要素で覆う。** マイコースはフィルターや並べ替えでブロックごと描き直されるため、付けたクラスは消える。CSS なら描き直された後も効き続ける
- **Moodle が持つ Bootstrap の `.stretched-link` を借りず、同じ内容を自前で書く。** クラスの付与が必要になり、上と同じ理由で消える
- **アクションメニュー（`.menu`）を `z-index` で前面へ出す。** 覆ったままでは星付け・非表示のボタンが押せない
- **表示形式（リスト・カード・概要）を区別せず `[data-region="course-content"]` で揃える。** 3種すべてに付く属性のため、ユーザーが表示を切り替えても効く
- **当たり判定の起点はコース名リンク（`a.coursename`）にする。** 画像リンクは `tabindex="-1"` で読み上げ対象から外れており、コース名側が本来の入口にあたる
- **コース名のテキストが選択できなくなる。** 覆った疑似要素がポインタを受けるための副作用として受け入れる
- **設定を持たない。** 仕様書（[`../../features/my-courses/clickable-card.md`](../../features/my-courses/clickable-card.md)）に設定項目が無い
- **ページ判定に [`../moodle/page.md`](../moodle/page.md) を使わず、セレクタの先頭へ `body.pagelayout-mycourses` を書く。** `document_start` の時点では body が無く判定できない
