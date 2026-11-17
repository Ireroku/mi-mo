# reverseSections モジュール

## 概要

コースページのセクション一覧を画面上で逆順に表示する。最新の回が一番上に来る。本文と左のコースインデックスの両方を反転させ、DOM の並びは変えずに CSS の `flex-direction` だけで行う。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — style 要素の注入
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順、キーと変数名の規約
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — セクション一覧のコンテナのセレクタと、2件ヒットする罠
- 参考: [`../home/hideElements.md`](../home/hideElements.md) — 無効時に空文字を渡して適用を解除する書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/reverseSections.ts` | 設定の型と CSS の組み立て |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/early.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/reverseSections.ts
export interface ReverseSectionsConfig {
  enabled: boolean;
}

export function applyReverseSections(config: ReverseSectionsConfig): void;
```

設定の定義:

```ts
// src/utils/settings.ts
import type { ReverseSectionsConfig } from "@/features/coursePage/reverseSections";

export const coursePageReverseSectionsSetting =
  storage.defineItem<ReverseSectionsConfig>(
    "local:coursePage.reverseSections",
    { fallback: { enabled: false } },
  );
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の2行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/early.content.ts
import { applyReverseSections } from "@/features/coursePage/reverseSections";
import { coursePageReverseSectionsSetting } from "@/utils/settings";

const config = await coursePageReverseSectionsSetting.getValue();
applyReverseSections(config);
```

同じ entrypoint が読む設定が複数ある場合、`Promise.all` でまとめる形は [`../README.md`](../README.md) の「設定は entrypoint が取得し、機能へ引数で渡す」が決めます。

## 処理の流れ

1. `config.enabled` が false の場合、空文字を `applyStyleSheet` へ渡して適用を解除する
2. true の場合、次の CSS を `applyStyleSheet` へ渡す

id は `mimo-course-page-reverse-sections` を使う。

```css
body.pagelayout-course #region-main div.course-content > div > ul[data-for="course_sectionlist"] {
  display: flex;
  flex-direction: column-reverse;
}

body.pagelayout-course #theme_boost-drawers-courseindex #course-index {
  display: flex;
  flex-direction: column-reverse;
}
```

## 決めごと

- **DOM を並べ替えず CSS で反転する。** `document_start` で注入できるため、元の順序が一瞬見えてから入れ替わるちらつきが起きない
- **Tab キーの移動順と Ctrl+F のヒット順は元のまま（古い回から新しい回へ）になる。** 見た目と操作順が食い違うが、ちらつきの無さを優先する
- **本文と同時に左のコースインデックス（`#course-index`）も反転する。** 本文だけを反転すると、同じ画面に逆向きの一覧が2つ並ぶ。実機で両方へ当てて、左右の並びが揃い幅も崩れないことを確認してある
- **トピック0（`data-number="0"`、「一般」）も反転に含める。** 例外を作らず、「一般」は一番下へ移る
- **`ul` を `display: flex` にする。** `flex-direction` を効かせるために必要
- **セレクタは `div.course-content > div > ul[...]` と直下の子で辿る。** セクションの概要文に同じ `data-for` を持つ `<ul>` が貼り付けられている場合があり、祖先を絞らないと2件ヒットする
- **`ul.weeks` のクラスは使わない。** コースフォーマット依存のため、コア共通の `data-for="course_sectionlist"` の方が安定する
- **ページ判定に [`../moodle/page.md`](../moodle/page.md) を使わず、セレクタの先頭へ `body.pagelayout-course` を書く。** `document_start` の時点では body が無く判定できない。CSS は body に class が付いた後で評価される
- **既定で無効にする。** Moodle が決めた並びを入れ替える機能で、入れた直後に断りなく順序が変わると、利用者は目当ての回を見失う。設定画面で選んだ利用者にだけ効かせる
- **編集モードでの挙動は、本文とコースインデックスのどちらも未確認。** 教員がセクションをドラッグして並べ替える画面では、見た目の位置とドロップ先の判定がねじれる可能性がある。コースインデックス側も同じで、ツリーのキーボード操作を持つ場合は移動の向きが見た目と食い違う。実機で確かめたのは非編集モードでの表示崩れが無いことだけで、[`../../moodle/course-page.md`](../../moodle/course-page.md) の採取も非編集モードに限られる。編集権限を持つアカウントで問題が出た時点で、セレクタに編集モードの除外を足す
