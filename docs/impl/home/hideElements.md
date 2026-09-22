# hideElements モジュール

## 概要

サイトホーム（`/`）のお知らせ・コースカテゴリ・コース検索を隠す。設定で true になっている対象のセレクタだけを集め、`display: none` を宣言する `<style>` を1つ注入する。DOM の走査を行わないため `document_start` で動き、対象が一度も描画されずに消える。

## 関連

- 資料: [`docs/moodle/home.md`](../../moodle/home.md) — 対象3要素のセレクタ。同名の要素が別の場所にも出るため、採取結果を見てから書く
- 使う: [`docs/impl/utils/settings.md`](../utils/settings.md) — 設定の取得。参照するのは entrypoint のみで、機能側は参照しない
- 資料: [`docs/features/home/hide-elements.md`](../../features/home/hide-elements.md) — 何を隠すか、なぜ隠すかの仕様

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/home/hideElements.ts` | 設定の型、対象とセレクタの対応、CSS の組み立てと注入 |
| `src/entrypoints/early.content.ts` | `document_start` で設定を読み、機能へ引数として渡す |

## インターフェース

```ts
// src/features/home/hideElements.ts
export interface HideElementsConfig {
  announcements: boolean;
  categories: boolean;
  search: boolean;
}

export function applyHideElements(config: HideElementsConfig): void;
```

```ts
// src/entrypoints/early.content.ts
export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  runAt: "document_start",
  async main() {
    const config = await homeHideElementsSetting.getValue();
    applyHideElements(config);
  },
});
```

## 処理の流れ

### 対象とセレクタの対応

`HideElementsConfig` のキーごとに、次のセレクタを対応させる。

| キー | セレクタ | 隠す対象 |
|---|---|---|
| `announcements` | `body.pagelayout-frontpage div.course-content` | お知らせ（サイトのトピック0領域） |
| `categories` | `body.pagelayout-frontpage #frontpage-category-names` | コースカテゴリ |
| `search` | `body.pagelayout-frontpage #region-main div.simplesearchform` | コース検索 |

先頭の `body.pagelayout-frontpage` がページ判定を兼ねる。サイトホーム以外ではどのセレクタもマッチしないため、この entrypoint はサイト全体に読み込んで構わない。

### applyHideElements

1. `config` の値が true のキーを集め、対応するセレクタの配列にする
2. `document.getElementById("mimo-home-hide-style")` で既存の style を探す
3. 配列が空の場合、既存の style があれば `textContent` を空文字列にして戻る。無ければ何もせず戻る
4. セレクタを `,` で連結し、`{ display: none !important; }` を付けた CSS 文字列を作る
5. 既存の style があれば、その `textContent` を 4 の文字列で差し替える
6. 無ければ `<style id="mimo-home-hide-style">` を作り、4 の文字列を入れて `document.head`（無ければ `document.documentElement`）へ追加する

## 決めごと

- **非表示を CSS だけで行い、JS で要素を探さない。** セレクタで一意に特定できるためテキスト照合が要らず、DOM 走査なしで済む。`document_start` でも動くので対象が一度も表示されない。代償として、**対象が実在したかを検証できない**。Moodle 側のマークアップが変われば、何も起きないまま黙って失敗する
- **[`../menu/navbar.md`](../menu/navbar.md) の非表示方式（`data-mimo-hidden` 属性 + 動的 style）は採らない。** あちらはメニュー項目をテキストで照合する必要があり JS が要る。こちらはセレクタで足りる
- **ページ判定を CSS セレクタに含め、JS の判定（`src/moodle/page.ts`）を呼ばない。** CSS だけで完結する処理のために JS の判定を挟むと、実行タイミングへの依存が増える
- **`div.course-content` は body クラスでの限定を外せない。** コースページにも同名のクラスが存在するため、外すとコースページの本文ごと消える
- **コース検索は `#region-main` で絞る。** `div.simplesearchform` はページ内に3件あり、残り2件はサイト全体検索のフォームで対象外
- **コース検索の親（`div.box.py-3.d-flex.justify-content-center`）はセレクタに使わない。** 1件に特定はできるが、Bootstrap のユーティリティクラスの並びに依存するためテーマの更新で壊れる
- **style の追加先は `document.head`、無ければ `document.documentElement`。** `document_start` の時点では `head` がまだ存在しないことがある
- **同じ id の style があれば中身を差し替える。** 設定の変更を監視して再適用する場合に、2枚目を積まずに済む
- **隠す対象が1つも無い場合も、既存の style を空にする。** 設定をすべて false へ変えて再適用した時に、前回注入した CSS が残って隠れたままになるのを防ぐ
- **`src/features/home/index.ts` を作らない。** 現状 home の機能はこれ1つで、re-export だけの層になる。home の機能が増えて entrypoint 側の import が膨らんだ時点で改めて検討する
- **entrypoint は機能ではなく `run_at` で分ける。** `early.content.ts` は `document_start` を必要とするものの共通の入れ物として使う。既存の [`shared.content.ts`](../../../src/entrypoints/shared.content.ts) には相乗りできない。あちらは `createShadowRootUi` の anchor に `#usernavigation` を指定して `ui.mount()` を直接呼ぶため、`document_start` では anchor が存在せずバッジのマウントに失敗する
