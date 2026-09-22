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

export function requestDownloads(items: DownloadItem[]): Promise<void>;

export function toTextDataUrl(text: string, mimeType: string): string;
```

background 側:

```ts
// src/entrypoints/background.ts
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    // DOWNLOAD_MESSAGE_TYPE のメッセージを受けて items を順に downloads へ渡す
  });
});
```

## 処理の流れ

### requestDownloads

1. `items` が空なら何もせず戻る
2. `DownloadMessage` を組み立て、`browser.runtime.sendMessage` で送る

### toTextDataUrl

1. `text` を `encodeURIComponent` で符号化する
2. `data:<mimeType>;charset=utf-8,<符号化した文字列>` を返す

### background の受け口

1. メッセージの `type` が `DOWNLOAD_MESSAGE_TYPE` でなければ何もしない
2. `items` を順に `browser.downloads.download({ url, filename })` へ渡す
3. `filename` が無い項目は、保存名を `downloads` に決めさせる

## 決めごと

- **`downloads` permission を `wxt.config.ts` の `manifest.permissions` へ宣言する。** WXT は API の使用を自動で検出しない。宣言が無いと実行時に失敗する。生成物の `.output/<target>/manifest.json` を見れば確認できる
- **保存を background で行う。** `browser.downloads` は content script から呼べない。呼べたとしても、ページの寿命に保存処理が縛られる
- **テキストを `data:` の URL にして渡し、`blob:` を使わない。** `blob:` の URL は作った文脈に紐づくため、background 側で解決できない場合がある。書き出すテキストはセクション1つ分で、`data:` の長さの上限に収まる
- **ファイルの保存名を `downloads` に決めさせる。** 資料のリンク（`/mod/resource/view.php?id=<id>`）はリダイレクトされ、その先の URL に元のファイル名と拡張子が入っている。API はリダイレクトを追って名前を決めるため、こちらで調べ直さずに済む
- **保存名が期待と違った場合は、依頼する側でリダイレクト先を解決してから渡す。** 資料（[`../../moodle/course-page.md`](../../moodle/course-page.md)）が記録している通り、拡張子を知るにはファイルごとに1回の往復が要る。まず往復なしで組み、実機で名前を確かめる
- **リンクのクリックによる保存（`<a download>`）を使わない。** content script から起こすダウンロードはブラウザによって止められる
- **失敗を呼び出し側へ返さない。** 保存の成否は background が受け取るもので、依頼する側の画面では扱えない。利用者はブラウザのダウンロード欄で結果を見る
