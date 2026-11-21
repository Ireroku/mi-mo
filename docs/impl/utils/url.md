# url モジュール

## 概要

URL の文字列から、クエリの `id` とパスの末尾のファイル名を読み取る。Moodle の URL は `view.php?id=<id>` の形で対象を指し、ファイルは `pluginfile.php/.../<ファイル名>` の末尾に名前を持つ。複数の機能が同じ読み方をするため、ここにまとめる。

## 関連

- 使う: [`../moodle/courseList.md`](../moodle/courseList.md) — 一覧のリンクからコースIDを読む
- 使う: [`../myCourses/todayOrder.md`](../myCourses/todayOrder.md) — 時間割のコマの URL からコースIDを読む
- 使う: [`../coursePage/gradeInline.md`](../coursePage/gradeInline.md) — 評定表のリンクから `cmid` を読む
- 使う: [`../coursePage/bulkDownload.md`](../coursePage/bulkDownload.md) — フォルダの `id` と、資料の転送先のファイル名を読む
- 使う: [`../coursePage/pageSave.md`](../coursePage/pageSave.md) — 埋め込まれたファイルの元の名前を読む

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/url.ts` | クエリの `id` とパスの末尾の読み取り |
| `src/utils/url.test.ts` | 単体テスト |

## インターフェース

```ts
// src/utils/url.ts
export function readIdParam(url: string): string | null;
export function lastPathSegment(url: URL): string;
```

## 処理の流れ

### readIdParam

1. `new URL(url, "https://dummy.example")` で解く。相対 URL も受け付ける
2. クエリの `id` を返す。無ければ null
3. 解けずに例外が出た場合は null を返す

### lastPathSegment

1. `pathname` を `/` で区切り、最後の要素を取る。末尾が `/` なら空文字になる
2. `decodeURIComponent` でデコードして返す。デコードできない並びを含む場合は、デコードせずに返す

## 決めごと

- **解けない URL で例外を投げず、null を返す。** 呼び出し側はどれも「読めなければ飛ばす」扱いで、例外を受けるより分岐が短い
- **起点に仮のオリジンを使う。** 読むのはクエリとパスだけで、オリジンは結果に出ない。`window.location` に頼らないため、テストと設定画面からも同じように呼べる
- **`lastPathSegment` は `URL` を受け取る。** 呼び出し側は相対 URL を自分の起点で解いた後に渡す。起点の選び方は呼び出し側が持つ
