# exportMarkdown モジュール

## 概要

コースセクションの説明文と、そこに並ぶ活動を、Markdown かプレーンテキストとして書き出す。セクションごとにボタンを置き、押したセクションの中身だけをファイルとして保存する。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 使う: [courseSections](../moodle/courseSections.md) — セクションとヘッダーの探索
- 使う: [`../utils/download.md`](../utils/download.md) — 書き出したテキストの保存
- 使う: [`../utils/filename.md`](../utils/filename.md) — ファイル名に使えない文字の置き換え
- 使う: [`../utils/markdown.md`](../utils/markdown.md) — 説明文とラベルの本文の変換
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — 活動の共通構造、種別ごとのクラス、課題の日時、ラベルの本文
- 参考: [`./autoattendButton.md`](./autoattendButton.md) — 同じコースページで活動を探す機能

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/exportMarkdown.ts` | 設定の型、ボタンの差し込み、保存の依頼 |
| `src/features/coursePage/export.logic.ts` | 活動の読み取りと文字列の組み立て |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/shared.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/export.logic.ts
export type ExportFormat = "markdown" | "text";

export interface ExportedActivity {
  name: string;
  kind: string; // modtype_ に続く種別
  url?: string;
  dates?: string[];
  body?: string; // ラベルの本文。読み取った時の形式の文字列
}

export interface ExportedSection {
  title: string;
  summary?: string; // セクションの説明文。読み取った時の形式の文字列
  activities: ExportedActivity[];
}

export function readSection(
  section: Element,
  format: ExportFormat,
): ExportedSection;

export function formatSection(
  section: ExportedSection,
  format: ExportFormat,
): string;
```

```ts
// src/features/coursePage/exportMarkdown.ts
export interface ExportConfig {
  enabled: boolean;
  format: ExportFormat;
}

export function initExportMarkdown(config: ExportConfig): void;
```

設定の定義:

```ts
// src/utils/settings.ts
export const coursePageExportSetting = storage.defineItem<ExportConfig>(
  "local:coursePage.export",
  { fallback: { enabled: true, format: "markdown" } },
);
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initExportMarkdown } from "@/features/coursePage/exportMarkdown";
import { coursePageExportSetting } from "@/utils/settings";

const config = await coursePageExportSetting.getValue();
if (config.enabled) {
  initExportMarkdown(config);
}
```

## 処理の流れ

### initExportMarkdown

1. `isCoursePage()` が false なら何もせず戻る
2. `#region-main div.course-content > div > ul[data-for="course_sectionlist"] > li.section` をすべて取る
3. 各セクションの `.course-section-header` の末尾へ `<button>` を1つ足す。クラスは `btn btn-outline-secondary btn-sm text-nowrap`、文言は「書き出す」
4. 押されたら、そのセクションについて `readSection` と `formatSection` を設定の出力形式で呼び、`requestDownloads` へ渡す
5. `requestDownloads` が reject した場合、`console.error("[mi-mo] exportMarkdown", error)` を出し、ボタンの文言を「保存に失敗しました」へ変える

保存名は `<セクション名>.md`（`text` の場合は `.txt`）にする。ファイル名に使えない文字は `sanitizeFilename` で置き換える。

### readSection

1. セクションの `.sectionname` のテキストを `title` にする
2. セクションの `.summarytext` の文章を `summary` にする。無いか、空の場合は `undefined`
3. セクション内の `li.activity` をすべて取り、順に読む。`.summarytext` の中にあるものは飛ばす
4. 各活動について次を読む

| 項目 | 読み取り元 |
|---|---|
| `kind` | `modtype_` で始まるクラスの、その後ろの部分 |
| `name` | `.activity-item` の `data-activityname` |
| `url` | `.activityname a` の `href` |
| `dates` | `[data-region="activity-dates"]` の各行のテキスト |
| `body` | `.activity-altcontent` の文章（ラベルの場合） |

`summary` と `body` の文章は、`format` が `markdown` なら `htmlToMarkdown`、`text` なら `htmlToPlainText` で文字列にする。前後の空白を落とし、空になった場合は `undefined` にする。

### formatSection

種別は次の対応表で日本語へ直す。表に無い種別は `kind` の文字列をそのまま使う。

| `kind` | 表示 |
|---|---|
| `resource` | ファイル |
| `assign` | 課題 |
| `url` | URL |
| `forum` | フォーラム |
| `page` | ページ |
| `quiz` | 小テスト |
| `autoattendmod` | 出欠 |
| `label` | （種別を出さない） |

`markdown` の場合:

```markdown
## <セクション名>

<セクションの説明文>

- [<活動名>](<URL>) — <種別>
  - 開始: 2026年 04月 10日(金曜日) 00:00
  - 期限: 2026年 04月 10日(金曜日) 23:59

<ラベルの本文>
```

URL を持たない活動は `[<活動名>]` の括弧を外し、名前だけを箇条書きにする。`dates` は活動ごとに入れ子の箇条書きで並べる。説明文は見出しの直後に置き、無い場合は何も出さない。ラベルは箇条書きにせず、本文を段落として置く。

`text` の場合、同じ内容を記号なしで並べる。

```text
<セクション名>

<セクションの説明文>

<活動名>（<種別>）
  <URL>
  開始: 2026年 04月 10日(金曜日) 00:00
  期限: 2026年 04月 10日(金曜日) 23:59

<ラベルの本文>
```

含める項目は2つの形式で揃える。違うのは記号の有無だけにする。説明文とラベルの本文に含まれるリストは、`text` でも `-` と番号の形で残る（[`../utils/markdown.md`](../utils/markdown.md)）。

## 決めごと

- **活動名を `data-activityname` から読み、リンクのテキストを使わない。** リンクのテキストには種別のラベル（「ファイル」「フォーラム」など）が読み上げ用に付いており、そのまま使うと名前が汚れる
- **ボタンを素の DOM で作り、Shadow DOM を使わない。** セクションの数だけ UI を作ることになり、`createShadowRootUi` を回数分呼ぶと重い
- **ボタンのクラスに `btn btn-outline-secondary btn-sm text-nowrap` を使う。** Moodle 自身がコースページで最も多く使っている組み合わせで、これに揃えると見た目が浮かない
- **種別を日本語へ直して出す。** 判定には `modtype_` のクラスを使いますが、そのまま書き出すと `resource` や `assign` といった内部の識別子がメモに混ざる
- **セクション単位で書き出し、コース全体をまとめる操作は置かない。** 仕様書が「セクション単位で一括して行える」としている。全体が欲しい場合はセクションの数だけ押す
- **セクションの説明文を書き出しに含める。** 「書き出す」はコースページに見えている内容を残すためのもので、課題の条件や注意事項は活動ではなく説明文に書かれる場合が多い。活動だけを書き出すと、リンクと日時しか残らない
- **説明文とラベルの本文を [`../utils/markdown.md`](../utils/markdown.md) で変換する。** `textContent` は段落の区切りを落とし、複数の段落が1行に繋がる。`innerText` は描画されている要素でしか改行を保たず、折りたたまれたセクションで同じことが起きる。Turndown はタグの種類だけを見るため、どちらの場合も段落・リスト・リンクが残る
- **`readSection` が出力形式を受け取る。** 説明文とラベルの本文は、HTML から文字列にする時点で形式が決まる。`formatSection` は文字列を並べるだけにする
- **活動の一覧から、説明文の中にある要素を外す。** 説明文には教員が貼り付けた HTML が入り、Moodle の活動に似た要素が紛れる場合がある（資料の「注意」）
- **ラベルは本文をそのまま段落として出す。** リンクを持たない活動で、名前より中身に意味がある
- **種別は `modtype_` のクラスから読む。** 表示名（「ファイル」「課題」）はリンクのテキストに紛れており、言語設定でも変わる
- **保存を [`../utils/download.md`](../utils/download.md) へ任せる。** content script から起こすダウンロードはブラウザに止められる場合がある
- **出力形式は設定で選び、押すたびに聞かない。** 書き出しは繰り返す操作で、そのたびに選ばせると手数が増える
