# bulkDownload モジュール

## 概要

コースセクションに置かれた資料のファイルを、セクション単位でまとめて保存する。リンクを1つずつ開く代わりに、ボタン1つで全件を保存する。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 使う: [`../utils/download.md`](../utils/download.md) — 保存の依頼
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — 「ファイルリンクと拡張子判定」節。ファイル名がリダイレクト先にしか無い事情
- 参考: [`./exportMarkdown.md`](./exportMarkdown.md) — 同じくセクションごとにボタンを置く機能

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/bulkDownload.ts` | ボタンの差し込みと保存の依頼 |
| `src/entrypoints/shared.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/bulkDownload.ts
export function collectResourceUrls(section: Element): string[];

export function initBulkDownload(): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initBulkDownload } from "@/features/coursePage/bulkDownload";

initBulkDownload();
```

## 処理の流れ

### collectResourceUrls

1. セクション内の `li.activity.modtype_resource` をすべて取る
2. 各要素の `.activityname a` の `href` を集める
3. 同じ URL が重複していれば1つに絞る

### initBulkDownload

1. `isCoursePage()` が false なら何もせず戻る
2. セクションをすべて取り、それぞれの `.course-section-header` の末尾へボタンを足す
3. `collectResourceUrls` が空になるセクションでは、ボタンを足さない
4. 押されたら、集めた URL を `requestDownloads` へ渡す。件数を文言に出す（「資料を保存（5件）」）

## 決めごと

- **リンクをそのまま `downloads` へ渡し、事前にリダイレクト先を調べない。** `/mod/resource/view.php?id=<id>` はファイル本体へリダイレクトされ、API がそれを追って保存名を決める。資料が記録している「拡張子の判定に1回の往復が要る」という制約は、ファイル名を画面に出す場合の話で、保存するだけなら通らずに済む
- **保存名が期待と違った場合に、往復して解決する形へ切り替える。** まず往復なしで組み、実機で確かめる。想定と違えば [`../utils/download.md`](../utils/download.md) の `filename` を使う形へ変える
- **対象を資料（`modtype_resource`）に限る。** 課題やページはファイルではなく Moodle の画面で、保存しても中身が手に入らない
- **フォルダ（`modtype_folder`）を対象にしない。** 採取したコースに無く、中のファイルの並び方が分かっていない。見つかった時点で足す
- **資料が1件も無いセクションにはボタンを置かない。** 押しても何も起きないボタンを並べない
- **件数をボタンの文言に出す。** 何件保存されるかを押す前に示す。ブラウザのダウンロード欄に同時に並ぶ数でもある
- **確認を挟まない。** 件数が文言に出ており、保存先はブラウザの設定に従う。押す前に分かる情報で足りる
- **ボタンを素の DOM で作る。** [`./exportMarkdown.md`](./exportMarkdown.md) と同じ理由で、セクションの数だけ Shadow DOM を作らない
- **設定を持たない。** 仕様書（[`../../features/course-page/bulk-download.md`](../../features/course-page/bulk-download.md)）に設定項目が無い
