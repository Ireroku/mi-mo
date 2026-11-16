# download モジュール

## 概要

content script からファイルの保存を依頼する窓口を作る。`downloads` の API は content script から呼べないため、background へメッセージを送り、そちらで実行する。

## 関連

- 使う: [`../coursePage/bulkDownload.md`](../coursePage/bulkDownload.md) — 資料の一括保存
- 使う: [`../coursePage/exportMarkdown.md`](../coursePage/exportMarkdown.md) — 書き出したテキストの保存
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

export function toTextDataUrl(text: string, mimeType: string): string;
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

### toTextDataUrl

1. `text` を `encodeURIComponent` で符号化する
2. `data:<mimeType>;charset=utf-8,<符号化した文字列>` を返す

### background の受け口

1. メッセージの `type` が `DOWNLOAD_MESSAGE_TYPE` でなければ何もせず、値も返さない
2. `items` のうち `url` が文字列のものを `browser.downloads.download({ url, filename })` へ渡す。全件を `Promise.allSettled` で待つ
3. `filename` が無い項目は、保存名を `downloads` に決めさせる
4. reject された項目を `console.error("[mi-mo] download", 理由)` で出し、件数を数える
5. `sendResponse({ failed: 件数 })` で応答する。リスナー自体は `true` を返し、応答が後から届くことをブラウザへ伝える

## 決めごと

- **`downloads` permission を `wxt.config.ts` の `manifest.permissions` へ宣言する。** WXT は API の使用を自動で検出しない。宣言が無いと実行時に失敗する。生成物の `.output/<target>/manifest.json` を見れば確認できる
- **保存を background で行う。** `browser.downloads` は content script から呼べない。呼べたとしても、ページの寿命に保存処理が縛られる
- **テキストを `data:` の URL にして渡し、`blob:` を使わない。** `blob:` の URL は作った文脈に紐づくため、background 側で解決できない場合がある。書き出すテキストはセクション1つ分で、`data:` の長さの上限に収まる
- **ファイルの保存名を `downloads` に決めさせる。** 資料のリンク（`/mod/resource/view.php?id=<id>`）はリダイレクトされ、その先の URL に元のファイル名と拡張子が入っている。API はリダイレクトを追って名前を決めるため、こちらで調べ直さずに済む
- **保存名が期待と違った場合は、依頼する側でリダイレクト先を解決してから渡す。** 資料（[`../../moodle/course-page.md`](../../moodle/course-page.md)）が記録している通り、拡張子を知るにはファイルごとに1回の往復が要る。まず往復なしで組み、実機で名前を確かめる
- **リンクのクリックによる保存（`<a download>`）を使わない。** content script から起こすダウンロードはブラウザによって止められる
- **保存を開始できたかどうかだけを呼び出し側へ返す。** `browser.downloads.download` は保存を開始した時点で解決するため、待ち時間はファイルの大きさに左右されない。開始に失敗した場合（permission の不足、不正な URL など）は利用者が気付けないため、依頼する側がボタンの文言で知らせる
- **保存の完了は待たず、途中の失敗も扱わない。** 開始した後の成否は、利用者がブラウザのダウンロード欄で見る
- **応答は `sendResponse` と `return true` で返し、リスナーから `Promise` を返さない。** `Promise` を返す形は Firefox では応答になるが、Chrome では無視されて送信側へ `undefined` が届く。両方で同じに動く書き方へ揃える
- **応答が `undefined` の場合も失敗として扱う。** background が起動していない、リスナーが登録されていないといった場合にこうなる。成功と区別できないままにしない
- **Safari では `browser.downloads` が使えない。** Chrome・Firefox・Edge は対応するが、Safari は対応しない。リポジトリ直下の [README.md](../../../README.md) で Safari 向けの公開は未定のため今は問題にならないが、着手する時点でこの窓口の中身を別の手段へ差し替えることになる。差し替えの影響を [`../coursePage/exportMarkdown.md`](../coursePage/exportMarkdown.md) と [`../coursePage/bulkDownload.md`](../coursePage/bulkDownload.md) へ及ばせないため、保存の経路をこのモジュールへ集めてある
