# sectionActions モジュール

## 概要

コースセクションのヘッダーの右端に、操作のボタンを並べる置き場所を作る。[`./exportMarkdown.md`](./exportMarkdown.md) の「書き出す」と [`./bulkDownload.md`](./bulkDownload.md) の「資料を保存（n件）」が、同じ置き場所と同じ見た目を共有する。ボタンはセクションタイトルと同じ行に、右寄せで並ぶ。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 置き場所を右端へ寄せる CSS の注入
- 使う: [`./sectionToggleDesign.md`](./sectionToggleDesign.md) — ボタンの見た目。同じクラスを当てる先になる
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — 「セクションのヘッダ」節と「セクションの一括開閉ボタン」節

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/sectionActions.ts` | 置き場所の用意とボタンの作成 |
| `src/features/coursePage/exportMarkdown.ts` | 呼び出し元 |
| `src/features/coursePage/bulkDownload.ts` | 呼び出し元 |

## インターフェース

```ts
// src/features/coursePage/sectionActions.ts
export const SECTION_ACTION_CLASS = "mimo-section-action";

export function addSectionAction(
  header: Element,
  marker: string,
  label: string,
): HTMLButtonElement | undefined;
```

`header` は [`../moodle/courseSections.md`](../moodle/courseSections.md) の `findCourseSectionHeaders` が返す `.course-section-header`。`marker` は呼び出し元を見分けるクラス（`mimo-export-button`、`mimo-bulk-download-button`）。戻り値のボタンへ、呼び出し元が `click` の処理を足す。

## 処理の流れ

1. `header` の中に `marker` のクラスを持つ要素が既にあれば、何もせず `undefined` を返す
2. 置き場所を寄せる CSS を `applyStyleSheet` へ渡す。id は `mimo-course-page-section-actions`
3. `header` の直下に `div.mimo-section-actions` が無ければ、末尾へ足す
4. `<button type="button">` を作り、クラス `btn btn-link btn-sm text-nowrap mimo-section-action` と `marker` を付け、文言を `label` にする
5. 置き場所の末尾へ足し、ボタンを返す

### 注入する CSS

```css
body.pagelayout-course .course-section-header:has(> .mimo-section-actions) {
  flex-wrap: wrap;
  row-gap: 0.5rem;
}
body.pagelayout-course .course-section-header > .mimo-section-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
  align-items: center;
  align-self: center;
  gap: 0.5rem;
  margin-left: auto;
}
body.pagelayout-course .course-section-header:has(> * > .section-collapsemenu) > .mimo-section-actions {
  align-self: flex-start;
  margin-top: 0.5rem;
}
```

## 決めごと

- **ボタンには自前のクラス `mimo-section-action` を付け、Moodle の `section-collapsemenu` を借りない。** 見た目は [`./sectionToggleDesign.md`](./sectionToggleDesign.md) が両方のクラスへ同じ規則で当てる。Moodle のクラスを借りると、Moodle のスクリプトや今後の版の CSS がこのボタンを拾うおそれがある。クラス名は `SECTION_ACTION_CLASS` として書き出し、sectionToggleDesign が読む
- **`btn btn-link btn-sm` を併せて付ける。** 要素は `<button>` のため、Bootstrap のクラスが無いとブラウザ既定のボタンの形になる。`btn-link` はリンクの見た目で、sectionToggleDesign が効かない時も「すべてを折りたたむ」と同じリンクの形に揃う
- **ボタンを1つの置き場所へまとめ、置き場所を `margin-left: auto` で右端へ寄せる。** ヘッダーは `d-flex` の横並びで、タイトルとバッジの後ろに続く。ボタンごとに寄せると2つ目以降の位置が決まらない
- **寄せる CSS を Bootstrap のクラス（`ml-auto`・`ms-auto`）に頼らず自前で注入する。** Moodle 4.5 は Bootstrap 4 の書き方と 5 の書き方が混在しており（ヘッダーのテンプレートに `me-3` がある）、どちらのクラスが効くかを実機で確かめていない
- **「すべてを折りたたむ」のある見出しでは、置き場所を上寄せにして上へ 0.5rem 空ける。** Moodle はそのボタンの入れ物へ `align-self-start mt-2` を付けている。中央寄せのままでは、同じ行で 4px 上にずれる（実機で確認）。ほかの見出しはタイトルと同じ高さのため、中央寄せのままにする
- **狭い画面では、置き場所を見出しの次の行へ折り返す。** 置き場所が縮まないと、長いタイトルが1文字ずつに潰れ、ボタンが画面の右へはみ出す（幅 420px で確認）。見出しに `flex-wrap` を当て、入りきらない時だけ置き場所ごと次の行へ回す。置き場所の中も折り返し、ボタンが1行に収まらない幅でもはみ出さないようにする
- **置き場所の中の並び順は、呼び出された順にする。** entrypoint が書き出し、一括保存の順に呼ぶかどうかで決まる。このモジュールは順序を持たない
- **重複の判定は `marker` で行う。** 同じ機能が2度呼ばれても、ボタンが増えない
