# pageSave モジュール

## 概要

コースセクションに置かれたページ資料（`modtype_page`）の本文を取得し、Markdown と画像のファイルとして保存する。専用のボタンは持たず、[bulkDownload](./bulkDownload.md) の「資料を保存」が集める対象へ加わる。

## 関連

- 使う: [`./bulkDownload.md`](./bulkDownload.md) — ボタンと、保存の依頼の流れ。このモジュールは対象を足す
- 使う: [`../utils/download.md`](../utils/download.md) — `requestDownloads` と `toTextDataUrl`
- 資料: [`../../moodle/mod-page.md`](../../moodle/mod-page.md) — ページ本体の構造、埋め込まれたファイルの URL
- 資料: [`../../features/course-page/page-save.md`](../../features/course-page/page-save.md) — 保存後のフォルダの形
- 資料: [Turndown](https://github.com/mixmark-io/turndown) — HTML から Markdown への変換
- 使う: [`../utils/filename.md`](../utils/filename.md) — ファイル名に使えない文字の置き換え

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/pageSave.logic.ts` | 取得した文書から、Markdown と保存するファイルの一覧を作る |
| `src/features/coursePage/pageSave.ts` | ページの収集と取得 |
| `src/features/coursePage/bulkDownload.ts` | 件数へページを足し、押された時にページの保存も依頼する |
| `package.json` | `turndown` と `@types/turndown` を足す |

## インターフェース

```ts
// src/features/coursePage/pageSave.logic.ts
import type { DownloadItem } from "@/utils/download";

export interface PageSource {
  name: string; // ページ名。フォルダ名とファイル名に使う
  url: string; // /mod/page/view.php?id=<id>
}

/**
 * 取得したページの文書から、保存するファイルの一覧を作る。
 * 先頭が本文の Markdown、残りが埋め込まれたファイル。
 * 本文が見つからない場合は空の配列を返す。
 */
export function buildPageDownloads(
  doc: Document,
  source: PageSource,
): DownloadItem[];
```

```ts
// src/features/coursePage/pageSave.ts
import type { DownloadItem } from "@/utils/download";
import type { PageSource } from "./pageSave.logic";

export function collectPages(section: Element): PageSource[];

/**
 * ページを1件ずつ取得し、保存するファイルの一覧をまとめて返す。
 * 取得に失敗したページは飛ばし、その件数を failed に入れる。
 */
export function fetchPageDownloads(
  pages: PageSource[],
  onProgress: (done: number, total: number) => void,
): Promise<{ items: DownloadItem[]; failed: number }>;
```

entrypoint からの呼び出しは足さない。`initBulkDownload` の中から使う。

## 処理の流れ

### collectPages

1. `section` の中の `li.activity.modtype_page` をすべて取る
2. それぞれの `.activityname a` から `href` を取る。ページ名は `export.logic.ts` の `readSection` と同じく、活動の要素が持つ `data-activityname` 属性から取る。`.instancename` の文字列は末尾に種別の語（「ページ」）を含むため使わない
3. リンクの無いもの（利用できない活動）は飛ばす
4. 同じセクションの中でページ名が重なる場合、2件目以降の末尾へ ` (2)` ` (3)` を足す

### fetchPageDownloads

1. `pages` を先頭から1件ずつ処理する。並列にしない
2. `fetch(url, { credentials: "include" })` で取得し、本文を `DOMParser` で `Document` にする
3. `buildPageDownloads` へ渡し、戻り値を結果へ足す
4. 取得が失敗した場合、または `buildPageDownloads` が空を返した場合は、`failed` を1つ増やして次へ進む
5. 1件終わるたびに `onProgress(済んだ件数, 全件数)` を呼ぶ

### buildPageDownloads

1. `doc` から `#region-main .generalbox > .no-overflow` を取る。無ければ空の配列を返す
2. 取った要素を `cloneNode(true)` で複製し、以降は複製を書き換える
3. 複製の中から、`img[src]`・`source[src]`・`audio[src]`・`video[src]`・`a[href]` を文書の順に取り、URL を `source.url` を基準に絶対 URL へ直す。`pluginfile.php` を指すものを保存の対象にする。それ以外は、絶対 URL を属性へ書き戻して終える
4. 集めた URL ごとに保存名を決める。同じ URL は同じ保存名にする
   - 画像（`img`）は、出現順の3桁の連番と元の拡張子にする（`001.PNG`）
   - それ以外は、URL の末尾の元のファイル名をデコードし、`sanitizeFilename` を通して使う
5. 複製の中の `src` と `href` を、決めた保存名（相対パス）へ書き換える。空白や括弧で Markdown のリンクが切れないよう、`encodeURI` を通す
6. 複製を Turndown で Markdown にする。`audio` と `video` は、ファイルへのリンク（`[<ファイル名>](<保存名>)`）にする規則を足す。先頭へ `# <ページ名>` と、元のページの URL を1行足す
7. フォルダ名を `sanitizeFilename(source.name)` とし、次の順で `DownloadItem` を返す
   - `{ url: toTextDataUrl(markdown, "text/markdown"), filename: "<フォルダ名>/<フォルダ名>.md" }`
   - 手順4の各ファイルについて `{ url: <絶対URL>, filename: "<フォルダ名>/<保存名>" }`

### bulkDownload 側の変更

1. ボタンの件数は、資料・フォルダ・ページの件数を足した数にする。すべて0件のセクションにはボタンを足さない
2. 押されたら、ボタンを `disabled` にする
3. ページがある場合、`fetchPageDownloads` を呼ぶ。`onProgress` でボタンの文言を「ページを取得中（2/6）」へ変える
4. 資料とフォルダの URL、ページの `items` を1つの配列にまとめ、`requestDownloads` へ渡す
5. 終わったら `disabled` を外し、文言を元へ戻す。`failed` が1以上の場合は「2件のページを保存できませんでした」、`requestDownloads` が reject した場合は「保存に失敗しました」にする

## 決めごと

- **専用のボタンを作らず、「資料を保存」へ足す。** 利用者にとっては、PDF もページも同じ「その回の資料」になる。置き方ごとにボタンを分けると、教員の置き方を利用者が見分けることになる
- **「書き出す」へは足さない。** 「書き出す」はコースページに見えている内容を1つのテキストにするもので、通信をしない。ページの取得を混ぜると、押してから保存までの時間と、失敗する箇所が変わる
- **1ページを1フォルダにし、画像を別のファイルとして保存する。** 画像を `data:` で Markdown へ埋め込む形は、スライド30枚のページで1ファイルが数十MBになり、[`../utils/download.md`](../utils/download.md) が前提にしている `data:` の長さに収まらない。ZIP にまとめる形は、圧縮のライブラリと、大きなデータを background へ渡す経路が新しく要る
- **画像の本体は取得せず、URL を `downloads` へ渡す。** `pluginfile.php` は同じオリジンにあり、ブラウザがログイン中の Cookie で保存する。content script が画像を読むと、メモリに全部を持つことになる
- **画像の保存名は連番にする。** スライドを並べたページでは、並び順がそのままスライドの順になる。元のファイル名は順序を表さない場合がある。フォルダをファイル名で並べるだけで順に読める
- **画像以外のファイルは元のファイル名を残す。** 音声や添付は、名前が中身を表す。連番にすると区別が付かない
- **HTML から Markdown への変換は Turndown に任せ、自前で書かない。** 本文は教員が自由に書いた HTML で、構造を仮定できない（資料の「注意点」）。`pre`・入れ子のリスト・リンクの中の画像といった組み合わせを自前で扱うと、取りこぼしが出る。追加するのは実行時の依存1つで、content script にだけ入る
- **変換は `pageSave.logic.ts` に置き、`Document` を引数で受け取る。** 通信と切り離すと、保存した HTML を読ませるだけで変換を確かめられる
- **出力は Markdown に固定し、「書き出す」の出力形式の設定を見ない。** プレーンテキストには画像への参照を書けない。画像が主体のページでは、本文が空のファイルになる
- **ページの取得は1件ずつ行う。** 並列にすると、69ページあるコースで Moodle へ一度に大量のリクエストを送る。進み具合をボタンに出すため、順に進む方が表示も素直になる
- **取得に失敗したページを飛ばして残りを保存する。** 1件の失敗で全部を止めると、保存できたはずの資料まで手に入らない。失敗があったことは、ボタンの文言で知らせる
- **ページを取得すると、Moodle 上でそのページが閲覧済みになる。** 利用者がリンクを開いた場合と同じ扱いで、避ける方法は無い。資料（`modtype_resource`）の保存でも同じことが起きている
- **本文の外を指すリンクを絶対 URL にする。** 保存した Markdown は Moodle の外で開く。相対のままだと、他のページや外部サイトへのリンクが切れる
- **取得できなかったページの件数を文言に出す。** 残りは保存されているため、「保存に失敗しました」だけでは全部が失敗したように読める

## 実機で確かめたこと

Chrome で、情報伝送工学の「講義資料」（6ページ、画像21〜30枚ずつ）を保存して確かめた。Firefox では確かめていない（[`../../known-issues.md`](../../known-issues.md)）。

| 確かめたこと | Firefox で違っていた場合 |
|---|---|
| `filename` へ `フォルダ/ファイル` の形を渡すと、ダウンロード先にフォルダが作られる | フォルダを使わず、`<ページ名> - 001.PNG` の形の名前にする |
| 1回の操作で百数十件の `downloads.download` を呼んでも、ブラウザが確認を出さず、途中で止めない | 件数に上限を設け、超える分は数回に分けて依頼する |
| `pluginfile.php` の画像を `downloads` へ渡すと、ログイン画面の HTML ではなく画像が保存される | content script で取得し、`data:` にして渡す。大きさの上限を決める |
