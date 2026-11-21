# styleSheet モジュール

## 概要

CSS を書いた `<style>` 要素をページへ1つ注入する。同じ id で呼び直すと中身を差し替える。DOM を走査せずセレクタだけで完結する機能が共有する。

## 関連

- 参考: [`../home/hideElements.md`](../home/hideElements.md) — この処理の元になった実装。注入の形をそのまま引き継ぐ

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/styleSheet.ts` | style 要素の生成と差し替え |

## インターフェース

```ts
// src/utils/styleSheet.ts
export function applyStyleSheet(id: string, css: string): void;
export function removeAllStyleSheets(): void;
```

使用例:

```ts
applyStyleSheet("mimo-course-page-reverse-sections", "ul { display: flex; }");
applyStyleSheet("mimo-course-page-reverse-sections", ""); // 適用を解除する
removeAllStyleSheets(); // id が mimo- で始まる style 要素をすべて外す
```

## 処理の流れ

1. `document.getElementById(id)` で既存の style 要素を探す
2. 見つかった場合、`textContent` が `css` と違えば置き換えて終わる
3. 見つからず `css` が空文字の場合、何もしない
4. 見つからない場合、`<style>` を作り `id` と `css` を与えて `document.head ?? document.documentElement` へ追加する

`removeAllStyleSheets` は、`style[id^="mimo-"]` に当たる要素をすべて取り除く。

## 決めごと

- **`document_start` から呼ばれることを前提にする。** その時点では `document.head` がまだ無いため、無ければ `document.documentElement` へ追加する
- **空文字を渡した場合、style 要素は残したまま中身だけ空にする。** 設定を切り替えるたびに要素を作り直さずに済む
- **id は `mimo-<機能>-<用途>` の形にし、呼び出し側が決める。** このモジュールは id の中身を検査しない。`removeAllStyleSheets` はこの接頭辞で自分の要素を見分ける
- **中身が同じなら書き換えない。** `early.content.ts` は [`pageCache.md`](./pageCache.md) の写しで当てた後、正本で同じ CSS を当て直す。同じ文字列でも入れ直すとスタイルの再計算が走る
- **全体のスイッチが切られた時に外す手段を持つ。** 写しでは有効だったが正本では切られていた場合、`early.content.ts` が写しで当てた分をまとめて外す
- **CSS 文字列の組み立ては担当しない。** セレクタと宣言を知るのは機能側で、このモジュールが知るのは注入の手順だけ
- **Moodle に依存しないため `src/utils/` に置く。** style 要素の注入は Moodle 固有の処理ではない
- **`src/features/home/hideElements.ts` が同じ処理を自前で持っている。** このモジュールを呼ぶ形へ寄せる作業は [`../home/hideElements.md`](../home/hideElements.md) の担当で、あちらの対象ファイルに挙げてある。両方が残ると、次に書く人がどちらを真似るか迷う
