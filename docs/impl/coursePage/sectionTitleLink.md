# sectionTitleLink モジュール

## 概要

コースページのセクションタイトルに下線を付け、リンクであることを見た目で分かるようにする。ポインタを乗せた時はリンク色へ変える。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — タイトルのセレクタと、標準の色・下線の実測値
- 参考: [`./reverseSections.md`](./reverseSections.md) — 同じページを CSS だけで直す機能の形

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/sectionTitleLink.ts` | CSS の組み立て |
| `src/entrypoints/early.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/sectionTitleLink.ts
export function applySectionTitleLink(): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。設定を持たないため `await` は要りません。

```ts
// src/entrypoints/early.content.ts
import { applySectionTitleLink } from "@/features/coursePage/sectionTitleLink";

applySectionTitleLink();
```

## 処理の流れ

1. 次の CSS 文字列を組み立てる
2. id に `mimo-course-page-section-title-link` を指定して `applyStyleSheet` へ渡す

```css
body.pagelayout-course #region-main .sectionname > a {
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 1px;
}

body.pagelayout-course #region-main .sectionname > a:hover {
  color: var(--primary, #0f6cbf);
}
```

## 決めごと

- **下線は常時出し、ポインタを乗せた時に色を変える。** 標準のタイトルは本文と同じ `rgb(29, 33, 37)` で下線も無く、乗せるまで気付けない。気付かせることが目的のため、静止した状態で差が出る下線を選ぶ
- **色の値を直接書かず `var(--primary)` を使う。** Moodle 4 の Boost が `:root` へ出力する変数で、リンク（`a.aalink`）の文字色と一致する。テーマの色が変わっても追随する
- **フォールバックに `#0f6cbf` を添える。** 採取時点の `--primary` の実測値。変数が消えた場合もリンク色が保たれる
- **`text-underline-offset` で下線を文字から離す。** 日本語の下端と下線が重なると字が潰れる
- **タッチ環境では `:hover` が発火せず、色は変わらない。** 常時出る下線を主とし、色の変化は補助として扱う。モバイル表示での確認は取れていない
- **`.sectionname > a` と直下の子で辿る。** タイトルの中に他のリンクが入った場合に巻き込まない
- **`#region-main` で絞る。** 本文のタイトルだけを対象にし、左のコースインデックス側の項目は触らない
- **トピック0（「一般」）のタイトルも対象に含める。** 全セクションのタイトルがリンクになっており、例外を作る理由が無い
- **設定を持たない。** 仕様書（[`../../features/course-page/section-title-link.md`](../../features/course-page/section-title-link.md)）に設定項目が無い
- **ページ判定に [`../moodle/page.md`](../moodle/page.md) を使わず、セレクタの先頭へ `body.pagelayout-course` を書く。** `document_start` の時点では body が無く判定できない
