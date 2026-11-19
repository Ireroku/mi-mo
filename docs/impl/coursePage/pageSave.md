# pageSave モジュール

## 概要

コースセクションに置かれたページ資料（`modtype_page`）の本文と画像を取得し、セクションごとに1つの ZIP として保存する。専用のボタンは持たず、[bulkDownload](./bulkDownload.md) の「資料を保存」が集める対象へ加わる。

## 関連

- 使う: [`./bulkDownload.md`](./bulkDownload.md) — ボタンと、保存の流れ。このモジュールは対象を足す
- 使う: [`../utils/download.md`](../utils/download.md) — `saveBlob`
- 使う: [`../utils/markdown.md`](../utils/markdown.md) — HTML から Markdown への変換
- 使う: [`../utils/filename.md`](../utils/filename.md) — ファイル名に使えない文字の置き換え
- 資料: [`../../moodle/mod-page.md`](../../moodle/mod-page.md) — ページ本体の構造、埋め込まれたファイルの URL
- 資料: [`../../features/course-page/page-save.md`](../../features/course-page/page-save.md) — 保存される ZIP の中の形
- 資料: [fflate](https://github.com/101arrowz/fflate) — ZIP の組み立て

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/pageSave.logic.ts` | 取得した文書から、本文の Markdown と、埋め込まれたファイルの一覧を作る |
| `src/features/coursePage/pageSave.ts` | ページの収集、本文とファイルの取得、ZIP の組み立て |
| `src/features/coursePage/bulkDownload.ts` | 件数へページを足し、押された時に ZIP を保存する |
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
```

```ts
// src/features/coursePage/pageSave.ts
import type { PageSource } from "./pageSave.logic";

export function collectPages(section: Element): PageSource[];

/**
 * ページを1件ずつ取得し、本文と埋め込まれたファイルを1つの ZIP にまとめる。
 * 本文か、埋め込まれたファイルのどれかを取得できなかったページの件数を failed に入れる。
 * 1件も入れられなかった場合、zip は null になる。
 */
export function fetchPagesZip(
  pages: PageSource[],
  onProgress: (done: number, total: number) => void,
): Promise<{ zip: Blob | null; failed: number }>;
```

entrypoint からの呼び出しは足さない。`initBulkDownload` の中から使う。

## 処理の流れ

### collectPages

1. `section` の中の `li.activity.modtype_page` をすべて取る
2. それぞれの `.activityname a` から `href` を取る。ページ名は `export.logic.ts` の `readSection` と同じく、活動の要素が持つ `data-activityname` 属性から取る。`.instancename` の文字列は末尾に種別の語（「ページ」）を含むため使わない
3. リンクの無いもの（利用できない活動）は飛ばす
4. 同じセクションの中でページ名が重なる場合、2件目以降の末尾へ ` (2)` ` (3)` を足す

### buildPageFiles

1. `doc` から `#region-main .generalbox > .no-overflow` を取る。無ければ `null` を返す
2. 取った要素を `cloneNode(true)` で複製し、以降は複製を書き換える
3. 複製の中から、`img[src]`・`source[src]`・`audio[src]`・`video[src]`・`a[href]` を文書の順に取り、URL を `source.url` を基準に絶対 URL へ直す。`pluginfile.php` を指すものを保存の対象にする。それ以外は、絶対 URL を属性へ書き戻して終える
4. 集めた URL ごとに保存名を決める。同じ URL は同じ保存名にする
   - 画像（`img`）は、出現順の3桁の連番と元の拡張子にする（`001.PNG`）
   - それ以外は、URL の末尾の元のファイル名をデコードし、`sanitizeFilename` を通して使う
5. 複製の中の `src` と `href` を、決めた保存名（相対パス）へ書き換える。空白や括弧で Markdown のリンクが切れないよう、`encodeURI` を通す
6. 複製を `htmlToMarkdown` で Markdown にする。先頭へ `# <ページ名>` と、元のページの URL を1行足す
7. `folder` を `sanitizeFilename(source.name)` とし、Markdown と、手順4の URL と保存名の一覧を返す

### fetchPagesZip

1. `pages` を先頭から1件ずつ処理する。ページは並列にしない
2. `fetch(url, { credentials: "include" })` で取得し、本文を `DOMParser` で `Document` にして `buildPageFiles` へ渡す
3. Markdown を `<folder>/<folder>.md` として ZIP の中身へ足す
4. `embedded` の各ファイルを `fetch` で取得し、`<folder>/<保存名>` として足す。1ページの中のファイルは並列に取得し、`Promise.allSettled` で全件を待つ
5. 本文の取得、`buildPageFiles`、ファイルの取得のどれかが失敗したページは、`console.error("[mi-mo] pageSave", URL, 理由)` を出して `failed` を1つ増やす。取得できたファイルは ZIP に残す
6. 1件終わるたびに `onProgress(済んだ件数, 全件数)` を呼ぶ
7. 中身が1件も無ければ `zip` を `null` にして返す。あれば fflate の `zipSync` へ `level: 0` で渡し、`application/zip` の `Blob` にして返す

### bulkDownload 側の変更

1. ボタンの件数は、資料・フォルダ・ページの件数を足した数にする。すべて0件のセクションにはボタンを足さない
2. 押されたら、ボタンを `disabled` にする
3. `fetchPagesZip` を呼ぶ。`onProgress` でボタンの文言を「ページを取得中（2/6）」へ変える
4. `zip` があれば、`saveBlob` で `<セクション名>.zip` として保存する。セクション名は `.sectionname` のテキストに `sanitizeFilename` を通したもので、取れない場合は「ページ資料」にする
5. 資料とフォルダを `requestDownloads` へ渡す。資料は [`./bulkDownload.md`](./bulkDownload.md) の決めごとの通り、転送先を解決してから渡す
6. 終わったら `disabled` を外し、文言を元へ戻す。`failed` が1以上の場合は「2件のページに保存できない内容がありました」、途中で例外が出た場合は「保存に失敗しました」にする

## 決めごと

- **専用のボタンを作らず、「資料を保存」へ足す。** 利用者にとっては、PDF もページも同じ「その回の資料」になる。置き方ごとにボタンを分けると、教員の置き方を利用者が見分けることになる
- **「書き出す」へは足さない。** 「書き出す」はコースページに見えている内容を1つのテキストにするもので、通信をしない。ページの取得を混ぜると、押してから保存までの時間と、失敗する箇所が変わる
- **セクションの中のページを1つの ZIP にまとめる。** 画像を1枚ずつ保存する形は、スライド30枚のページが6つあるセクションで百数十件の保存になり、ブラウザのダウンロードの演出がその数だけ走る。ZIP なら保存が1件で済む
- **ZIP の中では、1ページを1フォルダにする。** 画像を `data:` で Markdown へ埋め込む形は、1ファイルが数十MBになり、Markdown を開くエディタが重くなる
- **画像を content script で取得する。** ZIP へ入れるには中身が要る。`pluginfile.php` は同じオリジンにあり、ログイン中の Cookie で取得できる。セクション1つ分（数十MB）をメモリに持つことになる
- **ZIP の組み立ては fflate に任せ、圧縮しない（`level: 0`）。** 中身の大半は圧縮済みの画像で、圧縮しても小さくならない。圧縮を省くと、組み立てが画面を止める時間が短くなる
- **資料とフォルダは ZIP へ入れず、従来どおり URL を `downloads` へ渡す。** PDF や動画は大きさに上限が無く、content script のメモリへ読むと失敗する場合がある。1セクションの資料は数件で、保存の件数が問題にならない
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

## 実機で確かめたこと

Chrome で、ページのあるセクションを保存して確かめた。Firefox では確かめていない（[`../../known-issues.md`](../../known-issues.md)）。

| 確かめたこと | Firefox で違っていた場合 |
|---|---|
| ページの取得に時間がかかった後でも、`saveBlob` の保存がブラウザに止められない | background で ZIP を組み立て、`downloads` で保存する経路へ変える |
| ZIP を展開すると、ページごとのフォルダに Markdown と画像が入っている | fflate の設定を見直す |
