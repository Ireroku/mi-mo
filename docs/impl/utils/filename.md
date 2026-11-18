# filename モジュール

## 概要

保存するファイルやフォルダの名前から、ファイル名に使えない文字を取り除く。保存名を自分で決める機能と、保存を受け付ける background が共有する。

## 関連

- 参考: [`../coursePage/exportMarkdown.md`](../coursePage/exportMarkdown.md) — セクション名を保存名にする
- 参考: [`../coursePage/pageSave.md`](../coursePage/pageSave.md) — ページ名をフォルダ名にし、埋め込まれたファイルの名前を保存名にする
- 参考: [`./download.md`](./download.md) — background の受け口で、受け取った保存名を整える
- 資料: [filenamify](https://github.com/sindresorhus/filenamify) — 名前を整える処理の本体

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/filename.ts` | `filenamify` の呼び出し |

## インターフェース

```ts
// src/utils/filename.ts
export function sanitizeFilename(name: string): string;
```

## 処理の流れ

1. `filenamify/browser` の `filenamify` を `{ replacement: "-", maxLength: 200 }` で呼ぶ。`/` `\` `:` `*` `?` `"` `<` `>` `|` と制御文字を `-` へ置き換え、続いた置き換えは1つにまとめる。`.` だけの名前や `..` で始まる名前、`CON` などの Windows の予約名も避ける。末尾の `.` と空白は落とす
2. 前後の空白を落とす

## 決めごと

- **名前を整える規則を自分で書かず、`filenamify` に任せる。** 予約名や相対パスのように、文字の置き換えだけでは防げない名前がある。規則を書き足して保つより、手入れの続くライブラリに乗る
- **Node の `path` に頼らない `filenamify/browser` を読み込む。** 既定の入口は Node 向けの関数も含む
- **置き換え文字は `-` にする。** 既定の `!` より、元の名前の区切りとして読みやすい
- **長さは 200 文字に切る。** 既定の 100 文字では、日本語の長いページ名が途中で切れる。多くの OS の上限 255 より短くして、呼び出し側が名前へ足す分を残す。切る時は拡張子を残す
- **Windows で使えない文字に合わせる。** macOS で使えない文字はこの中に含まれる。保存したフォルダを別の OS へ移しても名前が変わらない
- **置き換えた結果が重なる場合を扱わない。** 重なりの解決は、名前の一覧を持つ呼び出し側が行う
