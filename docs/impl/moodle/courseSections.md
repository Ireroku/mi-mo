# courseSections モジュール

## 概要

コースページのセクション本体とヘッダーを組にして読み取る。あわせて、セクションのタイトルと、活動の名前・リンクを読む。[資料一括保存](../coursePage/bulkDownload.md)、[ページ資料の保存](../coursePage/pageSave.md)、[セクション書き出し](../coursePage/exportMarkdown.md)が同じ読み方を共有する。

## 関連

- 資料: [コースページの DOM](../../moodle/course-page.md)

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/moodle/courseSections.ts` | セクションとヘッダーの探索、タイトル・活動名・活動のリンクの読み取り |

## インターフェース

```ts
export function findCourseSectionHeaders(): { section: Element; header: Element }[];
export function readSectionTitle(section: Element): string;
export function activityLink(activity: Element): HTMLAnchorElement | null;
export function readActivityName(activity: Element): string;
```

## 処理の流れ

1. `#region-main div.course-content > div > ul[data-for="course_sectionlist"] > li.section` を文書順で取得する
2. 各セクション内の最初の `.course-section-header` を探す
3. ヘッダーが見つかった組だけを配列で返す

### readSectionTitle

1. セクション内の `.sectionname` の `textContent` を、前後の空白を除いて返す。無ければ空文字

### activityLink

1. 活動（`li.activity`）内の `.activityname a` を返す。無ければ null

### readActivityName

1. 活動内の `.activity-item` の `data-activityname` を、前後の空白を除いて読む
2. 空なら、`activityLink` の `textContent` を前後の空白を除いて読む
3. どちらも空なら空文字を返す

## 決めごと

- **DOM の探索と読み取りだけを共有する。** ボタンの重複判定、資料の有無、クリック処理は各利用元が持つ
- **読めない場合は空文字を返し、代わりの名前は呼び出し側が決める。** 書き出しは「セクション」、ページ資料の ZIP 名は「ページ資料」と、場面ごとに代わりの名前が違う
- **活動名は `data-activityname` を先に読む。** リンクのテキストには種別のラベル（「ファイル」など）が読み上げ用に付いている。属性はラベルを含まない
- **資料 URL は一括保存の初期化時、書き出す内容はクリック時に読む。** 探索結果の共有によって、各機能の取得タイミングを変えない
