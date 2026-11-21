# pageCache モジュール

## 概要

拡張機能の設定の写しを、Moodle のページの `localStorage` へ置く。`storage.local` は非同期でしか読めず、`document_start` の content script が待つ間に最初の描画が済むことがあります。同期で読める写しを描画前の判断に使い、隠すはずの要素が一瞬見える現象を防ぐ。

## 関連

- 使う: [`../README.md`](../README.md) — 「設定は entrypoint が取得し、機能へ引数で渡す」の節。写しを使う entrypoint の形はそちらが決める
- 使う: [`styleSheet.md`](./styleSheet.md) — 写しで当てた CSS を、正本で当て直す経路
- 参考: [Control Panel for Twitter の content.js](https://github.com/insin/control-panel-for-twitter/blob/master/content.js) — 同じ考えで、ロゴの置き換えの設定を `localStorage` へ写している

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/pageCache.ts` | 写しの読み書きと解釈 |
| `src/entrypoints/early.content.ts` | 写しで先に CSS を当て、正本を読んで当て直し、写しを更新する |

## インターフェース

```ts
// src/utils/pageCache.ts
export function parsePageCache<T>(raw: string | null, version: string): T | undefined;
export function readPageCache<T>(key: string, version: string): T | undefined;
export function writePageCache<T>(key: string, version: string, value: T): void;
```

`localStorage` に入る形:

```json
{ "version": "2026.11.21", "value": { "extension": { "enabled": true } } }
```

`early.content.ts` からの呼び出し:

```ts
const version = browser.runtime.getManifest().version;
const cached = readPageCache<EarlySettings>("mimo:early", version);
if (cached) {
  await applyEarly(cached);
}

// storage.local から正本を読む
writePageCache("mimo:early", version, settings);
await applyEarly(settings);
```

## 処理の流れ

1. `early.content.ts` が、`storage.local` を読む前に `readPageCache` で写しを読む
2. 写しがあれば、その値で CSS を当てる
3. `storage.local` から正本を読む
4. `writePageCache` で写しを正本に合わせ、正本の値で CSS を当て直す。全体のスイッチが切れていれば、`removeAllStyleSheets` で写しの分も外す

## 決めごと

- **正本は `storage.local` のままにし、写しはキャッシュとして扱う。** 毎回の読み込みで正本から上書きするため、写しがずれても次の読み込みで直る。設定画面は写しを知らない
- **写しで当てる間の `await` は、`runFeature` の分だけにする。** これはマイクロタスクで、ブラウザが描画する前に流れ切る。`storage.local` の読み出しは別のプロセスとのやり取りで、描画を挟む
- **写しが無い時は、正本を待ってから当てる。** 既定値を推し量って先に当てない。初回と、利用者がサイトのデータを消した直後の1回だけ、以前と同じ遅れが出る
- **拡張機能の版を写しに添え、版が違えば使わない。** 設定の形が版の間で変わっても、古い形の写しで機能を呼ばない
- **写すのは CSS を当てるか、属性の印を付けるだけの機能の設定に限る。** ページの `localStorage` は Moodle の JavaScript からも読めるため、氏名やコース名を入れない。右のドロワーの設定は、ピン留めのコースを除き `hidden` だけを写す。メニューの設定は、利用者の入れたリンク（`items`）を除き `hidden` だけを写す。`hidden` は Moodle の既定の項目の名前で、利用者の情報を含まない
- **キーは `mimo:early` の1つにまとめる。** 機能ごとにキーを分けると、拡張機能を外した後に残る項目が増える
- **`localStorage` の例外は握る。** Cookie を拒否する設定では触れるだけで例外になり、容量を超えると書き込みで例外になる。どちらも写しを使わずに正本で動く
- **拡張機能を外しても写しは残る。** 数百バイトの JSON で、読む者がいなくなるだけ。利用者はサイトのデータの消去で消せる。拡張機能を入れ直すと、最初の読み込みで正本の値に上書きされる
- **書き込みは中身が変わった時だけ行う。** 読み込みのたびに同じ文字列を書き直さない
