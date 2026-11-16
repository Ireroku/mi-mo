# markdown モジュール

## 概要

HTML の要素を、Markdown またはプレーンテキストへ変換する。教員が書いた HTML を文字列にする機能が共有する。

## 関連

- 参考: [`../coursePage/exportMarkdown.md`](../coursePage/exportMarkdown.md) — セクションの説明文とラベルの本文を変換する
- 参考: [`../coursePage/pageSave.md`](../coursePage/pageSave.md) — ページ資料の本文を変換する
- 資料: [Turndown](https://github.com/mixmark-io/turndown) — HTML から Markdown への変換

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/markdown.ts` | Turndown の設定と、変換の関数 |
| `package.json` | `turndown` と `@types/turndown` |

## インターフェース

```ts
// src/utils/markdown.ts

/** 要素の中身を Markdown にする。渡した要素は書き換えない。 */
export function htmlToMarkdown(el: Element): string;

/** 要素の中身を、段落とリストの区切りを保ったプレーンテキストにする。渡した要素は書き換えない。 */
export function htmlToPlainText(el: Element): string;
```

## 処理の流れ

Turndown のインスタンスを2つ、モジュールの読み込み時に作る。どちらも見出しは `#`、コードブロックは ` ``` `、箇条書きの記号は `-` にする。

### htmlToMarkdown

1. Markdown 用のインスタンスで変換する
2. `audio` と `video` は、ファイルへのリンク（`[<ファイル名>](<src>)`）にする。`src` は要素自身か、中の `source` から取る

### htmlToPlainText

プレーンテキスト用のインスタンスで変換する。Markdown 用との違いは次のとおり。

| 対象 | 出力 |
|---|---|
| `strong`・`b`・`em`・`i` | 中の文字列だけ |
| `h1`〜`h6` | 中の文字列を1つの段落として |
| `a` | `<文字列> (<URL>)`。文字列が URL と同じ場合と、`href` が無い場合は文字列だけ |
| `img` | `alt` の文字列 |
| `br` | 行末に空白を足さず、改行だけ |
| 記号（`*`・`[`・`1.` など） | エスケープしない |

リストは Markdown と同じ `-` と番号の形で残す。

## 決めごと

- **変換の規則を自前で書かず、Turndown に任せる。** 本文は教員が自由に書いた HTML で、構造を仮定できない。`pre`・入れ子のリスト・リンクの中の画像といった組み合わせを自前で扱うと、取りこぼしが出る
- **`innerText` を使わない。** `innerText` は描画されている要素でしか改行を保たず、折りたたまれたセクションでは段落が1行に繋がる。Turndown はタグの種類だけを見るため、描画の有無に左右されない。テスト環境（happy-dom）でも同じ結果になる
- **プレーンテキストも Turndown の規則の差し替えで作る。** 段落・改行・リストの扱いを Markdown と共有できる。別の変換を書くと、同じ HTML に対する2つの出力の構造がずれる
- **プレーンテキストでもリストの記号を残す。** 記号を落とすと、項目の区切りが段落と見分けられなくなる
- **リンクの URL を書き換えない。** 相対 URL を絶対 URL へ直す処理は、基準の URL を知っている呼び出し側が、変換の前に行う（[`../coursePage/pageSave.md`](../coursePage/pageSave.md)）
- **インスタンスを呼び出しのたびに作らない。** 設定は固定で、状態を持たない
