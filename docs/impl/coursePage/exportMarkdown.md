# exportMarkdown モジュール

## 概要

コースセクションに並ぶ活動を、Markdown かプレーンテキストとして書き出す。セクションごとにボタンを置き、押したセクションの中身だけをファイルとして保存する。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 使う: [`../utils/download.md`](../utils/download.md) — 書き出したテキストの保存
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
  body?: string; // ラベルの本文
}

export interface ExportedSection {
  title: string;
  activities: ExportedActivity[];
}

export function readSection(section: Element): ExportedSection;

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
3. 各セクションの `.course-section-header` の末尾へボタンを1つ足す。文言は「書き出す」
4. 押されたら、そのセクションについて `readSection` と `formatSection` を呼び、`requestDownloads` へ渡す

保存名は `<セクション名>.md`（`text` の場合は `.txt`）にする。ファイル名に使えない文字（`/` `\` `:` `*` `?` `"` `<` `>` `|`）は `-` へ置き換える。

### readSection

1. セクションの `.sectionname` のテキストを `title` にする
2. セクション内の `li.activity` をすべて取り、順に読む
3. 各活動について次を読む

| 項目 | 読み取り元 |
|---|---|
| `kind` | `modtype_` で始まるクラスの、その後ろの部分 |
| `name` | `.activity-item` の `data-activityname` |
| `url` | `.activityname a` の `href` |
| `dates` | `[data-region="activity-dates"]` の各行のテキスト |
| `body` | `.activity-altcontent` のテキスト（ラベルの場合） |

### formatSection

`markdown` の場合:

```markdown
## <セクション名>

- [<活動名>](<URL>) — <種別>
  - 開始: ... / 期限: ...

<ラベルの本文>
```

`text` の場合は記号を落とし、活動名・種別・URL を行で並べる。

## 決めごと

- **活動名を `data-activityname` から読み、リンクのテキストを使わない。** リンクのテキストには種別のラベル（「ファイル」「フォーラム」など）が読み上げ用に付いており、そのまま使うと名前が汚れる
- **ボタンを素の DOM で作り、Shadow DOM を使わない。** セクションの数だけ UI を作ることになり、`createShadowRootUi` を回数分呼ぶと重い。Moodle が持つ Bootstrap のボタンのクラスを借りれば見た目も揃う
- **セクション単位で書き出し、コース全体をまとめる操作は置かない。** 仕様書が「セクション単位で一括して行える」としている。全体が欲しい場合はセクションの数だけ押す
- **ラベルは本文をそのまま段落として出す。** リンクを持たない活動で、名前より中身に意味がある
- **HTML を Markdown へ変換しない。** ラベルの本文には書式付きの HTML が入る場合があるが、変換の規則を決め始めると際限がない。テキストとして取り出す
- **種別は `modtype_` のクラスから読む。** 表示名（「ファイル」「課題」）はリンクのテキストに紛れており、言語設定でも変わる
- **保存を [`../utils/download.md`](../utils/download.md) へ任せる。** content script から起こすダウンロードはブラウザに止められる場合がある
- **出力形式は設定で選び、押すたびに聞かない。** 書き出しは繰り返す操作で、そのたびに選ばせると手数が増える
