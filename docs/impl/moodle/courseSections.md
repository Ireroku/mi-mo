# courseSections モジュール

## 概要

コースページのセクション本体とヘッダーを組にして読み取る。[資料一括保存](../coursePage/bulkDownload.md)と[セクション書き出し](../coursePage/exportMarkdown.md)が同じ探索を共有する。

## 関連

- 資料: [コースページの DOM](../../moodle/course-page.md)

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/moodle/courseSections.ts` | セクションとヘッダーの探索 |

## インターフェース

```ts
export function findCourseSectionHeaders(): { section: Element; header: Element }[];
```

## 処理の流れ

1. `#region-main div.course-content > div > ul[data-for="course_sectionlist"] > li.section` を文書順で取得する
2. 各セクション内の最初の `.course-section-header` を探す
3. ヘッダーが見つかった組だけを配列で返す

## 決めごと

- **DOM の探索だけを共有する。** ボタンの重複判定、資料の有無、クリック処理は各利用元が持つ
- **資料 URL は一括保存の初期化時、書き出す内容はクリック時に読む。** 探索結果の共有によって、各機能の取得タイミングを変えない
