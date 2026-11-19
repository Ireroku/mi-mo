# bulkDownload モジュール

## 概要

コースセクションに置かれた資料のファイル・フォルダ・ページ資料を、セクション単位でまとめて保存する。リンクを1つずつ開く代わりに、ボタン1つで全件を保存する。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 使う: [courseSections](../moodle/courseSections.md) — セクションとヘッダーの探索
- 使う: [`./sectionActions.md`](./sectionActions.md) — ヘッダーの右端へのボタンの追加と、その見た目
- 使う: [`../utils/download.md`](../utils/download.md) — 保存の依頼
- 使う: [`./pageSave.md`](./pageSave.md) — ページ資料の収集と取得。ボタンを押した後の流れはそちらが持つ
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — 「ファイルリンクと拡張子判定」節。ファイル名がリダイレクト先にしか無い事情。フォルダの ZIP の保存先
- 参考: [`./exportMarkdown.md`](./exportMarkdown.md) — 同じくセクションごとにボタンを置く機能

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/bulkDownload.ts` | ボタンの差し込みと保存の依頼 |
| `src/entrypoints/shared.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/bulkDownload.ts
export function collectResourceUrls(section: Element): string[];

export function collectFolderUrls(section: Element): string[];

export function initBulkDownload(): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initBulkDownload } from "@/features/coursePage/bulkDownload";

initBulkDownload();
```

## 処理の流れ

### collectResourceUrls

1. セクション内の `li.activity.modtype_resource` をすべて取る
2. 各要素の `.activityname a` の `href` を集める
3. 同じ URL が重複していれば1つに絞る

### collectFolderUrls

1. セクション内の `li.activity.modtype_folder` をすべて取る
2. 各要素の `.activityname a` の `href` から `id` を読む。リンクの無いものは飛ばす
3. `/mod/folder/download_folder.php?id=<id>` を集める。重複していれば1つに絞る

### initBulkDownload

1. `isCoursePage()` が false なら何もせず戻る
2. セクションをすべて取る。`collectResourceUrls`・`collectFolderUrls`・`collectPages` がすべて空になるセクションでは、ボタンを足さない
3. 文言は、資料・フォルダ・ページを足した件数を含めて「資料を保存（5件）」とする
4. `addSectionAction(header, "mimo-bulk-download-button", 文言)` でヘッダーへボタンを足す。`undefined` が返ったセクションは飛ばす
5. 押された後の流れは [`./pageSave.md`](./pageSave.md) の「bulkDownload 側の変更」に従う。ページを取得して1つの ZIP として保存し、資料とフォルダの URL を `requestDownloads` へ渡す
6. `requestDownloads` が reject した場合、`console.error("[mi-mo] bulkDownload", error)` を出し、ボタンの文言を「保存に失敗しました」へ変える

## 決めごと

- **リンクへ `redirect=1` を足してから渡す。** 資料の表示設定が「埋め込み」の場合、`/mod/resource/view.php?id=<id>` は転送せずに表示用のページを返し、そのまま渡すと HTML が保存される。`redirect=1` を付けると、表示設定にかかわらずファイル本体（`pluginfile.php`）へ転送される。実機で確認済み
- **資料は保存の前に転送先を解決し、ファイル名を添えて渡す。** 押された時に、資料の URL ごとに `fetch(url, { method: "HEAD" })` を送り、転送後の `response.url`（`pluginfile.php/.../<ファイル名>`）と、その末尾を `decodeURIComponent` した名前を `DownloadItem` にする。Firefox の `downloads` は転送元の URL から名前を決め、`view.php` で保存する（実機で確認）。転送先の `Content-Disposition` は `inline` のため、Firefox はその名前も使わない。解決に失敗した資料は、元の URL のまま渡す
- **フォルダは転送先を解決せずに渡す。** `download_folder.php` は `Content-Disposition: attachment` で ZIP の名前を返し、Firefox もその名前で保存する
- **対象を資料（`modtype_resource`）・フォルダ（`modtype_folder`）・ページ（`modtype_page`）にする。** 課題や小テストは Moodle の画面で、保存しても中身が手に入らない。ページは本文を取得して Markdown にする
- **フォルダ（`modtype_folder`）は、中身をまとめた ZIP を1件として保存する。** Moodle がフォルダのページに置いている「フォルダをダウンロードする」と同じ保存先を使う。中のファイルを1つずつ集める形は、フォルダごとにページの取得が要る。ZIP なら通信を足さずに済み、フォルダの中の階層も残る
- **資料が1件も無いセクションにはボタンを置かない。** 押しても何も起きないボタンを並べない
- **件数をボタンの文言に出す。** 何件の資料が保存されるかを押す前に示す。ページは何件あっても1つの ZIP になるため、ブラウザのダウンロード欄に並ぶ数は、資料とフォルダの件数に1を足した数になる
- **確認を挟まない。** 件数が文言に出ており、保存先はブラウザの設定に従う。押す前に分かる情報で足りる
- **ボタンを素の DOM で作る。** [`./exportMarkdown.md`](./exportMarkdown.md) と同じ理由で、セクションの数だけ Shadow DOM を作らない。置き場所と見た目は [`./sectionActions.md`](./sectionActions.md) に任せる
- **設定を持たない。** 仕様書（[`../../features/course-page/bulk-download.md`](../../features/course-page/bulk-download.md)）に設定項目が無い
