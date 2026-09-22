# home container モジュール

## 概要

ホームへ差し込む要素をまとめて入れる器を1つ用意する。挨拶・最終アクセス・時間割がいずれも同じ場所へ出るため、それぞれが直接 Moodle の DOM へ割り込まず、この器の中へ順に並べる。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — サイトホームとダッシュボードの判定
- 資料: [`../../moodle/home.md`](../../moodle/home.md) — 2つのページそれぞれの差し込み先
- 参考: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 同じ id の要素を作り直さずに使い回す書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/home/container.ts` | 器の生成と差し込み |

## インターフェース

```ts
// src/features/home/container.ts
export const HOME_CONTAINER_ID = "mimo-home-top";

export function ensureHomeContainer(): HTMLElement | undefined;
```

使う側は、返った要素を `createShadowRootUi` の `anchor` に渡し、`append` へ `last` を指定します。

```ts
const container = ensureHomeContainer();
if (!container) return;

const ui = await createShadowRootUi(ctx, {
  name: "mimo-greeting",
  position: "inline",
  anchor: container,
  append: "last",
  onMount: /* ... */,
});
```

## 処理の流れ

1. `document.getElementById(HOME_CONTAINER_ID)` を探す。見つかればそれを返す
2. ページ種別を判定し、次の差し込み先を決める。どちらでもない場合は `undefined` を返す

| ページ | 差し込み先 | 置き方 |
|---|---|---|
| サイトホーム | `#region-main div.course-content` | その直前 |
| ダッシュボード | `#block-region-content` | その先頭 |

3. 差し込み先が見つからない場合は `undefined` を返す
4. `<div>` を作り、`id` に `HOME_CONTAINER_ID` を与えて差し込み、それを返す

## 決めごと

- **ホームへ出す機能が Moodle の DOM へ直接割り込まない。** 挨拶・最終アクセス・時間割の3つが同じ場所へ出る。それぞれが `append: "before"` で割り込むと、並び順が呼び出し順の裏返しになり、機能を足すたびに順序が変わる
- **並び順は器へ入れた順にする。** `append: "last"` で積むため、entrypoint が呼ぶ順がそのまま上から下の順になる。順序を変えたい場合は entrypoint の呼び出し順を入れ替える
- **器は空のまま残ってもよい。** すべての機能が無効でも、中身の無い `<div>` が1つ残るだけで表示に影響しない
- **2度目以降の呼び出しで作り直さない。** 3つの機能がそれぞれ呼ぶため、id で見つけて使い回す
- **サイトホームとダッシュボードで置き方が違う。** サイトホームは既存の要素の前に割り込み、ダッシュボードはブロック領域の先頭へ入れる。どちらも [`../../moodle/home.md`](../../moodle/home.md) が「新規要素を挿入するなら自然」としている位置
- **`document_idle` で呼ばれることを前提にする。** 差し込み先の要素が描かれた後でなければ見つからない
- **中身のスタイルを持たない。** 器は位置を決めるだけで、見た目は各機能が Shadow DOM の中で決める
