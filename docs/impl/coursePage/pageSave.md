# pageSave モジュール

## 概要

コースセクションに置かれたページ資料（`modtype_page`）の本文と画像を取得し、セクションごとに1つの ZIP として保存する。中身が Markdown 1つだけ（画像も添付も無いページ1件）なら、ZIP にせず `.md` のまま保存する。コースページでは専用のボタンは持たず、[bulkDownload](./bulkDownload.md) の「資料を保存」が集める対象へ加わる。ページ資料の画面（`/mod/page/view.php`）と課題の画面（`/mod/assign/view.php`）では、bulkDownload が同じボタンを「完了マークする」の帯の右端に置き、開いている画面だけを保存する。課題の画面では、開始・期限・提出できるファイルの種類を YAML の Frontmatter に、説明を本文にする。

## 関連

- 使う: [`./bulkDownload.md`](./bulkDownload.md) — ボタンと、保存の流れ。このモジュールは対象を足す
- 使う: [`../utils/download.md`](../utils/download.md) — `saveBlob`
- 使う: [`../utils/markdown.md`](../utils/markdown.md) — HTML から Markdown への変換
- 使う: [`../utils/filename.md`](../utils/filename.md) — ファイル名に使えない文字の置き換え
- 使う: [courseSections](../moodle/courseSections.md) — 活動のリンクと活動名、セクションのタイトルの読み取り
- 使う: [`../utils/url.md`](../utils/url.md) — URL の末尾のファイル名の読み取り
- 資料: [`../../moodle/mod-page.md`](../../moodle/mod-page.md) — ページ本体の構造、埋め込まれたファイルの URL
- 資料: [`../../moodle/mod-assign.md`](../../moodle/mod-assign.md) — 課題の画面の帯、提出できるファイルの種類の出る場所
- 資料: [`../../features/course-page/page-save.md`](../../features/course-page/page-save.md) — 保存される ZIP の中の形
- 資料: [fflate](https://github.com/101arrowz/fflate) — ZIP の組み立て

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/pageSave.logic.ts` | 取得した文書から、本文の Markdown と、埋め込まれたファイルの一覧を作る。課題の画面の Frontmatter も作る |
| `src/features/coursePage/pageSave.ts` | ページの収集、本文とファイルの取得、ZIP の組み立て。課題のファイルの種類の取得 |
| `src/features/coursePage/bulkDownload.ts` | 件数へページを足し、押された時に ZIP を保存する。ページ資料と課題の画面にもボタンを置く |
| `package.json` | `fflate` を足す |

## インターフェース

```ts
// src/features/coursePage/pageSave.logic.ts
export interface PageSource {
  name: string; // ページ名。フォルダ名とファイル名に使う
  url: string; // /mod/page/view.php?id=<id>
}

export interface PageFiles {
  folder: string; // ZIP の中でこのページを入れるフォルダ名
  markdown: string; // 本文。<folder>/<folder>.md として保存する
  embedded: { url: string; name: string }[]; // 本文に埋め込まれたファイルと、フォルダの中での保存名
}

/**
 * 取得したページの文書から、本文の Markdown と、埋め込まれたファイルの一覧を作る。
 * 本文が見つからない場合は null を返す。
 */
export function buildPageFiles(
  doc: Document,
  source: PageSource,
): PageFiles | null;

/**
 * 「2026年 11月 24日(火曜日) 00:00」を「2026-11-24T00:00」にする。読めない場合は null を返す。
 */
export function parseMoodleDate(text: string): string | null;

/**
 * 提出の編集の画面の文書から、提出できるファイルの拡張子を重複なく読む。
 */
export function readFileTypes(doc: Document): string[];

/**
 * 取得した課題の画面の文書から、開始・期限・ファイルの種類を Frontmatter に、説明を本文にした Markdown を作る。
 * 説明と日付の帯が見つからない場合は null を返す。
 */
export function buildAssignFiles(
  doc: Document,
  source: PageSource,
  fileTypes: string[],
): PageFiles | null;
```

```ts
// src/features/coursePage/pageSave.ts
import type { PageSource } from "./pageSave.logic";

export function collectPages(section: Element): PageSource[];

/**
 * ページを1件ずつ取得し、本文と埋め込まれたファイルを1つの ZIP（`<zipTitle>.zip`）にまとめる。
 * 中身が .md の1件だけなら、ZIP にせず `<フォルダ名>.md` のファイルにする。
 * 本文か、埋め込まれたファイルのどれかを取得できなかったページの件数を failed に入れる。
 * 1件も入れられなかった場合、file は null になる。
 */
export function fetchPagesFile(
  pages: PageSource[],
  zipTitle: string, // ファイル名に使えない文字を置き換え済みのもの
  onProgress: (done: number, total: number) => void,
  build?: (doc: Document, page: PageSource) => Promise<PageFiles | null>, // 既定は buildPageFiles
): Promise<{ file: File | null; failed: number }>;

/**
 * 課題の画面の文書に提出の編集のフォームがあれば、編集の画面を GET で取得してファイルの種類を読む。
 * フォームが無い場合と、取得に失敗した場合は空の配列を返す。
 */
export function fetchFileTypes(doc: Document, url: string): Promise<string[]>;
```

entrypoint からの呼び出しは足さない。`initBulkDownload` の中から使う。

## 処理の流れ

### collectPages

1. `section` の中の `li.activity.modtype_page` をすべて取る
2. それぞれの `activityLink`（`.activityname a`）から `href` を取る。ページ名は `export.logic.ts` の `readSection` と同じく `readActivityName` で読み、活動の要素が持つ `data-activityname` 属性を使う。`.instancename` の文字列は末尾に種別の語（「ページ」）を含むため使わない
3. リンクの無いもの（利用できない活動）は飛ばす
4. 同じセクションの中でページ名が重なる場合、2件目以降の末尾へ ` (2)` ` (3)` を足す

### buildPageFiles

1. `doc` から `#region-main .generalbox > .no-overflow` を取る。無ければ `null` を返す
2. 取った要素を `cloneNode(true)` で複製し、以降は複製を書き換える
3. 複製の中から、`img[src]`・`source[src]`・`audio[src]`・`video[src]`・`a[href]` を文書の順に取り、URL を `source.url` を基準に絶対 URL へ直す。`pluginfile.php` を指すものと、`data:` URL の画像（`img`）を保存の対象にする。それ以外は、絶対 URL を属性へ書き戻して終える
4. 集めた URL ごとに保存名を決める。同じ URL は同じ保存名にする
   - 画像（`img`）は、出現順の3桁の連番と元の拡張子にする（`001.PNG`）。`data:` URL の画像は、MIME の種類から拡張子を決める（`image/png` なら `001.png`、`image/jpeg` なら `.jpg`）
   - それ以外は、URL の末尾の元のファイル名を `lastPathSegment` でデコードし、`sanitizeFilename` を通して使う
5. 複製の中の `src` と `href` を、決めた保存名（相対パス）へ書き換える。空白や括弧で Markdown のリンクが切れないよう、`encodeURI` を通す
6. 複製を `htmlToMarkdown` で Markdown にする。先頭へ `# <ページ名>` と、元のページの URL を1行足す
7. `folder` を `sanitizeFilename(source.name)` とし、Markdown と、手順4の URL と保存名の一覧を返す

### fetchPagesFile

1. `pages` を先頭から1件ずつ処理する。ページは並列にしない
2. `fetch(url, { credentials: "include" })` で取得し、本文を `DOMParser` で `Document` にして `build`（既定は `buildPageFiles`）へ渡す
3. Markdown を `<folder>/<folder>.md` として ZIP の中身へ足す
4. `embedded` の各ファイルを `fetch` で取得し（`data:` URL もそのまま `fetch` で中身に直る）、`<folder>/<保存名>` として足す。1ページの中のファイルは並列に取得し、`Promise.allSettled` で全件を待つ
5. 本文の取得、`buildPageFiles`、ファイルの取得のどれかが失敗したページは、`console.error("[mi-mo] pageSave", URL, 理由)` を出して `failed` を1つ増やす。取得できたファイルは ZIP に残す
6. 1件終わるたびに `onProgress(済んだ件数, 全件数)` を呼ぶ
7. 中身が1件も無ければ `file` を `null` にして返す。中身が `.md` の1件だけなら、それを `<folder>.md` の名前の `File`（`text/markdown;charset=utf-8`）にして返す。2件以上なら fflate の `zipSync` へ `level: 0` で渡し、`<zipTitle>.zip` の名前の `File`（`application/zip`）にして返す

### bulkDownload 側の変更

1. ボタンの件数は、資料・フォルダ・ページの件数を足した数にする。すべて0件のセクションにはボタンを足さない
2. 押されたら、ボタンを `disabled` にする
3. `fetchPagesFile` を呼ぶ。`zipTitle` はセクション名。`onProgress` でボタンの文言を「ページを取得中（2/6）」へ変える
4. `file` があれば、`saveBlob` で `file.name` の名前で保存する。ZIP なら `<セクション名>.zip`、`.md` 1つなら `<ページ名>.md` になる。セクション名は `readSectionTitle` で読んだ `.sectionname` のテキストに `sanitizeFilename` を通したもので、取れない場合は「ページ資料」にする
5. 資料とフォルダを `requestDownloads` へ渡す。資料は [`./bulkDownload.md`](./bulkDownload.md) の決めごとの通り、転送先を解決してから渡す
6. 終わったら `disabled` を外し、文言を元へ戻す。`failed` が1以上の場合は「2件のページに保存できない内容がありました」、途中で例外が出た場合は「保存に失敗しました」にする

### ページ資料の画面

1. `initBulkDownload` は、`isModPage()` が true なら、コースページの処理の代わりにこちらを行う
2. 灰色の帯の中の `#region-main .activity-header[data-for="page-activity-header"] > .activity-information` を取る。無ければ戻る
3. その中に `.completion-info`（「完了マークする」）があればそこを、無ければ `.activity-information` を置き場所の親にする
4. `addSectionAction(親, "mimo-bulk-download-button", "資料を保存")` で、コースページと同じボタンを右端へ置く。件数は付けない
5. ページ名は `.page-header-headings h1` の文字列から読む。取れない場合は「ページ」にする
6. 押された後は「bulkDownload 側の変更」と同じ流れで、`pages` を開いているページ1件（`location.href`）にし、ZIP の名前をページ名にする。画像も添付も無いページは `<ページ名>.md` になる。資料とフォルダは無い

### 課題の画面

1. `initBulkDownload` は、`isModAssign()` が true なら、「ページ資料の画面」と同じ流れでボタンを置く。`fetchPagesFile` へ渡す `build` だけを差し替える
2. `build` は、取得した課題の画面の文書を `fetchFileTypes` へ渡し、その結果と一緒に `buildAssignFiles` へ渡す
3. `fetchFileTypes` は、文書に `input[name="action"][value="editsubmission"]` が無ければ空の配列を返す。あれば `url` の `action` を `editsubmission` にした URL を GET で取得し、`readFileTypes` で読む
4. `buildAssignFiles` は、`#region-main .activity-header[data-for="page-activity-header"]` を取る。無ければ `null` を返す
5. Frontmatter の項目を次の順に並べる。文字列は `JSON.stringify` で引用符を付ける
   - `title`: 課題名
   - `url`: 課題の画面の URL
   - `start`・`due`: `.activity-dates > div` の `strong` が「開始」「期限」（`Open`・`Due`）を含む行の日付を `parseMoodleDate` で読んだもの。引用符を付けない。読めない行は飛ばす
   - `file_types`: 拡張子のリスト。空なら項目ごと書かない
6. `.activity-description` があれば、ページ資料の本文と同じ処理（画像とファイルの保存名、絶対 URL、`htmlToMarkdown`）で本文にする
7. Markdown を `---` で囲んだ Frontmatter と、空行と、本文の順に並べる。本文が無ければ Frontmatter だけにする

## 決めごと

- **コースページでは専用のボタンを作らず、「資料を保存」へ足す。** 利用者にとっては、PDF もページも同じ「その回の資料」になる。置き方ごとにボタンを分けると、教員の置き方を利用者が見分けることになる
- **「書き出す」へは足さない。** 「書き出す」はコースページに見えている内容を1つのテキストにするもので、通信をしない。ページの取得を混ぜると、押してから保存までの時間と、失敗する箇所が変わる
- **セクションの中のページを1つの ZIP にまとめる。** 画像を1枚ずつ保存する形は、スライド30枚のページが6つあるセクションで百数十件の保存になり、ブラウザのダウンロードの演出がその数だけ走る。ZIP なら保存が1件で済む
- **中身が Markdown 1つだけなら ZIP にしない。** 画像の無いページや説明だけの課題を保存すると、展開しないと読めない ZIP の中に .md が1つだけ入る形になる。名前はページ名（課題名）にする。セクションの保存でも同じ規則にし、画面ごとに分けない。ブラウザのダウンロード欄に並ぶ数は変わらない
- **ZIP の中では、1ページを1フォルダにする。** 画像を `data:` で Markdown へ埋め込む形は、1ファイルが数十MBになり、Markdown を開くエディタが重くなる
- **画像を content script で取得する。** ZIP へ入れるには中身が要る。`pluginfile.php` は同じオリジンにあり、ログイン中の Cookie で取得できる。セクション1つ分（数十MB）をメモリに持つことになる
- **ZIP の組み立ては fflate に任せ、圧縮しない（`level: 0`）。** 中身の大半は圧縮済みの画像で、圧縮しても小さくならない。圧縮を省くと、組み立てが画面を止める時間が短くなる
- **資料とフォルダは ZIP へ入れず、従来どおり URL を `downloads` へ渡す。** PDF や動画は大きさに上限が無く、content script のメモリへ読むと失敗する場合がある。1セクションの資料は数件で、保存の件数が問題にならない
- **`data:` URL の画像もファイルに分ける。** エディタで貼り付けた画像は、本文へ `data:` で直に入る。そのまま Markdown へ写すと、1行が数十万文字になり読めない（実機で確認）
- **画像の保存名は連番にする。** スライドを並べたページでは、並び順がそのままスライドの順になる。元のファイル名は順序を表さない場合がある。フォルダをファイル名で並べるだけで順に読める
- **画像以外のファイルは元のファイル名を残す。** 音声や添付は、名前が中身を表す。連番にすると区別が付かない
- **HTML から Markdown への変換は [`../utils/markdown.md`](../utils/markdown.md) に任せる。** 本文は教員が自由に書いた HTML で、構造を仮定できない（資料の「注意点」）
- **変換は `pageSave.logic.ts` に置き、`Document` を引数で受け取る。** 通信と切り離すと、保存した HTML を読ませるだけで変換を確かめられる
- **出力は Markdown に固定し、「書き出す」の出力形式の設定を見ない。** プレーンテキストには画像への参照を書けない。画像が主体のページでは、本文が空のファイルになる
- **ページの取得は1件ずつ行う。** 並列にすると、69ページあるコースで Moodle へ一度に大量のリクエストを送る。進み具合をボタンに出すため、順に進む方が表示も素直になる
- **取得に失敗したページやファイルを飛ばして残りを保存する。** 1件の失敗で全部を止めると、保存できたはずの資料まで手に入らない。失敗があったことは、ボタンの文言で知らせる
- **ページを取得すると、Moodle 上でそのページが閲覧済みになる。** 利用者がリンクを開いた場合と同じ扱いで、避ける方法は無い。資料（`modtype_resource`）の保存でも同じことが起きている
- **本文の外を指すリンクを絶対 URL にする。** 保存した Markdown は Moodle の外で開く。相対のままだと、他のページや外部サイトへのリンクが切れる
- **失敗のあったページの件数を文言に出す。** 残りは保存されているため、「保存に失敗しました」だけでは全部が失敗したように読める
- **ページ資料の画面でも保存できるようにする。** セクションの中の1ページだけが欲しい場合がある。コースページのボタンはセクションの全部を保存するため、要らない資料まで落ちてくる
- **ページ資料の画面のボタンは、コースページの「資料を保存」と同じものを、「完了マークする」の帯の右端に置く。** その画面で押せる操作はこの帯に並んでいる。ボタンの作りと押した後の流れを共有し、別のボタンを作らない。件数は付けない（1件に決まっている）
- **ページ資料の画面でも、表示中の文書を使わず取得し直す。** `fetchPagesFile` をそのまま使えば、本文の読み方と ZIP の形がコースページと同じになる。通信は1回増えるが、開いた時点で閲覧済みになっているため、記録は変わらない
- **完了の条件が無い画面でも、帯の中へボタンを置く。** 帯は完了の条件が無いページにも出る（中身が空の細い帯になる）。帯そのものが無い画面では置かない
- **課題の画面にも、同じ「資料を保存」を置く。** 課題の説明・期限を手元へ残したい場面がある。別の名前のボタンを作ると、置き方と押した後の流れを2つ持つことになる。保存の流れは `build` の差し替えだけで共有する
- **課題の開始・期限・ファイルの種類は YAML の Frontmatter に書く。** 本文と分けておけば、Obsidian などのエディタがプロパティとして読み、並べ替えや絞り込みに使える
- **日付は秒とタイムゾーンを付けない ISO 8601（`2026-11-24T00:00`）にする。** Moodle の表示は利用者の設定の時刻で、タイムゾーンを画面から確実には読めない。引用符を付けないと、YAML を読むエディタが日時として扱う
- **ファイルの種類は、提出の編集の画面を GET で取得して読む。** 課題の画面には出ない。編集の画面を開くだけでは提出は変わらず（実機で確認）、提出の変更・削除は `sesskey` を付けた POST でしか起きない。このモジュールは POST も `sesskey` も送らない
- **提出の編集のフォームが無い課題では、ファイルの種類を取りに行かない。** 編集の画面を開けない利用者や期間では、取得しても読めない。通信を1回減らせる

## 実機で確かめたこと

Chrome で、ページのあるセクションを保存して確かめた。Firefox では確かめていない（[`../../known-issues.md`](../../known-issues.md)）。

| 確かめたこと | Firefox で違っていた場合 |
|---|---|
| ページの取得に時間がかかった後でも、`saveBlob` の保存がブラウザに止められない | background で ZIP を組み立て、`downloads` で保存する経路へ変える |
| ZIP を展開すると、ページごとのフォルダに Markdown と画像が入っている | fflate の設定を見直す |
