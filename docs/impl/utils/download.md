# download モジュール

## 概要

content script からファイルを保存する窓口を作る。URL の保存は、`downloads` の API が content script から呼べないため、background へメッセージを送ってそちらで実行する。content script の中で作ったデータは、リンクのクリックで保存する。

## 関連

- 使う: [`../coursePage/bulkDownload.md`](../coursePage/bulkDownload.md) — 資料の一括保存
- 使う: [`../coursePage/exportMarkdown.md`](../coursePage/exportMarkdown.md) — 書き出したテキストの保存
- 使う: [`../coursePage/pageSave.md`](../coursePage/pageSave.md) — ページ資料をまとめた ZIP の保存
- 使う: [`./filename.md`](./filename.md) — 受け取った保存名を整える
- 資料: [WXT: Entrypoints](https://wxt.dev/guide/essentials/entrypoints.html) — `defineBackground` の書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/download.ts` | メッセージの型と、依頼する側の窓口 |
| `src/entrypoints/background.ts` | 依頼を受けて `downloads` を呼ぶ |
| `wxt.config.ts` | `downloads` permission を manifest へ宣言する |

## インターフェース

```ts
// src/utils/download.ts
export const DOWNLOAD_MESSAGE_TYPE = "mimo:download";

export interface DownloadItem {
  url: string;
  filename?: string;
}

export interface DownloadMessage {
  type: typeof DOWNLOAD_MESSAGE_TYPE;
  items: DownloadItem[];
}

export interface DownloadResponse {
  failed: number; // 保存を開始できなかった件数
}

export function requestDownloads(items: DownloadItem[]): Promise<void>;

export function saveBlob(blob: Blob, filename: string): void;
```

background 側:

```ts
// src/entrypoints/background.ts
export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      // DOWNLOAD_MESSAGE_TYPE のメッセージを受けて items を downloads へ渡し、
      // DownloadResponse を sendResponse で返す
    },
  );
});
```

## 処理の流れ

### requestDownloads

1. `items` が空なら何もせず戻る
2. `DownloadMessage` を組み立て、`browser.runtime.sendMessage` で送り、`DownloadResponse` を待つ
3. 応答が無い場合、または `failed` が1以上の場合は reject する
4. それ以外は解決する。解決するのは保存を開始できた時点で、保存の完了は待たない

### saveBlob

1. `URL.createObjectURL` で `blob` の URL を作る
2. `href` にその URL、`download` に `filename` を持つ `<a hidden>` を `document.body` へ足し、`click()` を呼んで外す
3. 60秒後に `URL.revokeObjectURL` で URL を返す

### background の受け口

1. メッセージの `type` が `DOWNLOAD_MESSAGE_TYPE` でなければ何もせず、値も返さない
2. `items` のうち `url` が文字列のものを `browser.downloads.download({ url, filename })` へ渡す。全件を `Promise.allSettled` で待つ
3. `filename` が文字列の項目は、`sanitizeFilename`（[`./filename.md`](./filename.md)）へ通してから渡す。文字列でない項目は `filename` を渡さず、保存名を `downloads` に決めさせる
4. reject された項目を `console.error("[mi-mo] download", 理由)` で出し、件数を数える
5. `sendResponse({ failed: 件数 })` で応答する。リスナー自体は `true` を返し、応答が後から届くことをブラウザへ伝える

## 決めごと

- **`downloads` permission を `wxt.config.ts` の `manifest.permissions` へ宣言する。** WXT は API の使用を自動で検出しない。宣言が無いと実行時に失敗する。生成物の `.output/<target>/manifest.json` を見れば確認できる
- **保存を background で行う。** `browser.downloads` は content script から呼べない。呼べたとしても、ページの寿命に保存処理が縛られる
- **保存名は依頼する側が決めて渡す。** Chrome の `downloads` は転送を追い、`Content-Disposition` から名前を決める。Firefox は転送元の URL から決めるため、資料のリンク（`/mod/resource/view.php?id=<id>`）を渡すと `view.php` の名前で保存される（実機で確認）。転送先の解決は [`../coursePage/bulkDownload.md`](../coursePage/bulkDownload.md) が行う。名前を渡さない項目は、`Content-Disposition: attachment` で名前の付いて返るもの（フォルダの ZIP）に限る
- **URL の保存にリンクのクリック（`<a download>`）を使わない。** ページから続けて起こす複数の保存は、ブラウザが確認を出して止める。別のオリジンへ転送される URL では `download` 属性の保存名も効かない
- **content script の中で作ったデータは、大きさにかかわらず `saveBlob` で保存する。** `blob:` の URL は background で解決できない場合がある。`data:` の URL を background へ渡すと、Firefox では応答が返らず、送り手に「Promised response from onMessage listener went out of scope」が届いた（書き出しで実機で確認）。メッセージで中身を background へ送る形は、Chrome では JSON に直されるため、バイナリをそのまま渡せない。リンクのクリックなら、作った文脈の中で保存まで終わる。保存は1回の操作につき1件に限る
- **`saveBlob` は URL を60秒後に返す。** 保存が始まる前に返すと失敗する。返さないと、ページを開いている間データがメモリに残る
- **受け口でも保存名を整える。** 依頼する側も名前を整えるが、組み立てに誤りがあると `..` や予約名が混ざり、保存先のフォルダの外や意図しない名前で保存される。受け口は1つで、すべての保存がここを通るため、ここで1回整えれば足りる。保存名は1階層の名前だけを受け取る
- **保存を開始できたかどうかだけを呼び出し側へ返す。** `browser.downloads.download` は保存を開始した時点で解決するため、待ち時間はファイルの大きさに左右されない。開始に失敗した場合（permission の不足、不正な URL など）は利用者が気付けないため、依頼する側がボタンの文言で知らせる
- **保存の完了は待たず、途中の失敗も扱わない。** 開始した後の成否は、利用者がブラウザのダウンロード欄で見る
- **応答は `sendResponse` と `return true` で返し、リスナーから `Promise` を返さない。** `Promise` を返す形は Firefox では応答になるが、Chrome では無視されて送信側へ `undefined` が届く。両方で同じに動く書き方へ揃える
- **応答が `undefined` の場合も失敗として扱う。** background が起動していない、リスナーが登録されていないといった場合にこうなる。成功と区別できないままにしない
- **Safari では `browser.downloads` が使えない。** `saveBlob` はこの API を使わない。 Chrome・Firefox・Edge は対応するが、Safari は対応しない。リポジトリ直下の [README.md](../../../README.md) で Safari 向けの公開は未定のため今は問題にならないが、着手する時点でこの窓口の中身を別の手段へ差し替えることになる。差し替えの影響を [`../coursePage/exportMarkdown.md`](../coursePage/exportMarkdown.md) と [`../coursePage/bulkDownload.md`](../coursePage/bulkDownload.md) へ及ばせないため、保存の経路をこのモジュールへ集めてある
