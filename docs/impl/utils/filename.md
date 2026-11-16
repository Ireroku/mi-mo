# filename モジュール

## 概要

保存するファイルやフォルダの名前から、ファイル名に使えない文字を取り除く。保存名を自分で決める機能が共有する。

## 関連

- 参考: [`../coursePage/exportMarkdown.md`](../coursePage/exportMarkdown.md) — セクション名を保存名にする
- 参考: [`../coursePage/pageSave.md`](../coursePage/pageSave.md) — ページ名をフォルダ名にし、埋め込まれたファイルの名前を保存名にする

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/filename.ts` | 文字の置き換え |

## インターフェース

```ts
// src/utils/filename.ts
export function sanitizeFilename(name: string): string;
```

## 処理の流れ

1. `/` `\` `:` `*` `?` `"` `<` `>` `|` を `-` へ置き換える
2. 前後の空白を落とす

## 決めごと

- **Windows で使えない文字に合わせる。** macOS で使えない文字はこの中に含まれる。保存したフォルダを別の OS へ移しても名前が変わらない
- **置き換えた結果が重なる場合を扱わない。** 重なりの解決は、名前の一覧を持つ呼び出し側が行う
