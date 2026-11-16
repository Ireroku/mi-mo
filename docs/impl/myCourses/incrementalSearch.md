# incrementalSearch モジュール

## 概要

マイコースの検索欄を、サーバーへ問い合わせず手元で絞り込む形に置き換える。Moodle 標準のキー入力の処理を止めたうえで、画面に並んでいるコース要素を打鍵ごとに隠す。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — マイコースかどうかの判定
- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 隠すための CSS の注入
- 資料: [`../../moodle/my-courses.md`](../../moodle/my-courses.md) — 検索欄のセレクタ、`keyup` で再描画が走る仕組み、コース1件を表す属性
- 参考: [`./clickableCard.md`](./clickableCard.md) — 同じ一覧を対象にする機能

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/myCourses/incrementalSearch.ts` | 絞り込みの実装 |
| `src/entrypoints/shared.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/myCourses/incrementalSearch.ts
export function initIncrementalSearch(ctx: ContentScriptContext): void;
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initIncrementalSearch } from "@/features/myCourses/incrementalSearch";

initIncrementalSearch(ctx);
```

## 処理の流れ

### initIncrementalSearch

1. [`../moodle/page.md`](../moodle/page.md) の `isMyCourses()` が false なら何もせず戻る
2. 隠すための CSS を `applyStyleSheet` へ渡す。id は `mimo-my-courses-incremental-search`
3. `document` へ `keyup` のリスナーを**キャプチャフェーズで**登録する。登録は `ctx.addEventListener` で行い、content script の失効時に外れるようにする
4. 一覧の描き直しを監視する `MutationObserver` を登録する。`ctx.onInvalidated` で `disconnect` する

### 注入する CSS

```css
body.pagelayout-mycourses [data-mimo-filtered] {
  display: none !important;
}

body.pagelayout-mycourses [data-mimo-search-empty] {
  padding: 1rem 0;
  text-align: center;
  color: var(--secondary, #6c757d);
}
```

### keyup の横取り

1. `event.target` が `.block-myoverview [data-region="input"]` に一致しなければ、何もせず戻る
2. 一致する場合、`event.stopPropagation()` を呼ぶ
3. 入力欄の値で絞り込む

### 絞り込み

1. `.block-myoverview [data-region="course-content"]` をすべて取る
2. 各要素の `.coursename` のテキストを取り、前後の空白を除いて小文字にする
3. 検索語も同じように整え、含まれない要素へ `data-mimo-filtered` を付ける。含まれる要素からは外す
4. 検索語が空の場合、すべての要素から `data-mimo-filtered` を外す
5. 残った件数が0で、かつ検索語が空でない場合、一覧の末尾へ `data-mimo-search-empty` を持つ要素を1つ置き、「該当するコースがありません」と出す。それ以外の場合は取り除く

### 再描画の監視

`.block-myoverview` へ `MutationObserver` を `{ childList: true, subtree: true }` で張り、変化があれば入力欄の現在の値で絞り込み直す。コース要素自身には張らない。描き直しのたびに別のノードへ入れ替わるため、そこを監視すると1度で外れる。

## 決めごと

- **Moodle 標準の `keyup` 処理を `stopPropagation` で止める。** 標準の実装は打鍵のたびに webservice を呼び、ブロック全体を描き直す。止めないと、手元で隠した結果がサーバーの応答で上書きされ、1.5秒の待ちも消えない
- **リスナーをキャプチャフェーズで `document` へ登録する。** Moodle 側のハンドラが入力欄に直接付いているのか、上位へ委譲されているのかを問わず、最上流で捕まえれば確実に止まる。`stopPropagation` はそこから下流への伝播をすべて止める
- **止めるのは `keyup` だけにする。** 他のキーイベントやクリックまで止めると、クリアボタンなど標準の操作を巻き込む
- **隠すのに属性 `data-mimo-filtered` と CSS を使い、`style` を直接書き換えない。** 要素ごとに `display` を書くと、Moodle 側が持っている表示状態（カード表示とリスト表示で異なる）を壊す
- **`data-mimo-hidden`（`global.css` にあるもの）を使わない。** あちらは Shadow DOM の中で効くもので、Moodle のページ本体には届かない。名前も用途ごとに分けておく
- **照合の対象はコース名だけにする。** カテゴリ名まで含めると、同じカテゴリの全コースが一度に残り、絞り込みとして働かない
- **大文字と小文字を区別しない。** 科目名に英字が混ざる場合に、打鍵の形を問わず当たるようにする
- **一覧が描き直されたら、入力欄の値で絞り込み直す。** 並べ替えや表示形式の切り替えでは、標準の再描画が起きる。その後もフィルターが効いたままになるようにする
- **`MutationObserver` で属性の変化を監視しない。** 自分が付けた `data-mimo-filtered` に反応して、無限に絞り込み直すことになる
- **`document_idle` で初期化する。** 一覧が描かれた後でなければ対象を取れない。CSS だけで完結する他の機能と違い、`document_start` では動かない
- **設定を持たない。** 仕様書（[`../../features/my-courses/incremental-search.md`](../../features/my-courses/incremental-search.md)）に設定項目が無い
