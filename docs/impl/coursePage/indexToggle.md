# indexToggle モジュール

## 概要

コースインデックスの一括開閉を、1つのトグルボタンにまとめる。標準ではドロップダウンを開いて「すべてを展開する」「すべてを折りたたむ」のどちらかを選ぶ形になっており、操作が2手かかる。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 標準のボタンを隠す CSS の注入
- 資料: [`../../moodle/drawer.md`](../../moodle/drawer.md) — 「コースインデックスのセクションの開閉状態」節。`aria-expanded` での判定方法
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — ドロップダウンと2つのリンクの構造
- 参考: [`./autoattendButton.md`](./autoattendButton.md) — `createShadowRootUi` でボタンを差し込む書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/indexToggle.ts` | 状態の判定と差し込み |
| `src/features/coursePage/IndexToggle.svelte` | トグルボタンの描画 |
| `src/entrypoints/shared.content.ts` | 機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/indexToggle.ts
export type IndexState = "allExpanded" | "allCollapsed" | "mixed";

export function readIndexState(): IndexState | undefined;

export function toggleIndex(state: IndexState): void;

export async function initIndexToggle(ctx: ContentScriptContext): Promise<void>;
```

```ts
// IndexToggle.svelte の Props
interface Props {
  state: IndexState;
  onToggle: () => void;
}
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の1行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initIndexToggle } from "@/features/coursePage/indexToggle";

await initIndexToggle(ctx);
```

## 処理の流れ

### readIndexState

1. `#course-index [data-for="section"]` の総数を数える。0 件なら `undefined` を返す
2. そのうち `[aria-expanded="false"]` の件数を数える
3. 0 件なら `allExpanded`、総数と一致するなら `allCollapsed`、それ以外は `mixed` を返す

### toggleIndex

`state` が `allCollapsed` の場合は展開、それ以外（`allExpanded` と `mixed`）は折りたたみを実行する。実行は対応するリンクの `click()` を呼ぶ形で行う。

| 実行内容 | セレクタ |
|---|---|
| 展開 | `[data-action="expandallcourseindexsections"]` |
| 折りたたみ | `[data-action="collapseallcourseindexsections"]` |

### initIndexToggle

1. `isCoursePage()` が false なら何もせず戻る
2. `#courseindexdrawercontrolsmenubutton` を探す。無ければ何もせず戻る
3. 標準のドロップダウンを隠す CSS を `applyStyleSheet` へ渡す。id は `mimo-course-page-index-toggle`
4. `createShadowRootUi` で `IndexToggle.svelte` をマウントする
5. `#course-index` の `aria-expanded` の変化を `MutationObserver` で監視し、変わるたびに `readIndexState()` を読み直してボタンへ渡す

| 設定 | 値 |
|---|---|
| `name` | `mimo-index-toggle` |
| `position` | `inline` |
| `anchor` | `#courseindexdrawercontrolsmenubutton` |
| `append` | `after` |

### 注入する CSS

```css
body.pagelayout-course #courseindexdrawercontrolsmenubutton {
  display: none !important;
}
```

### IndexToggle.svelte

`state` が `allCollapsed` なら「すべて開く」、それ以外なら「すべて閉じる」と出す。押されたら `onToggle` を呼ぶ。

## 決めごと

- **混在している時は折りたたむ方へ倒す。** コースインデックスは回の数だけ縦に伸びるため、いくつか開いた状態からボタンを押す動機は「散らかったものを畳んで全体を見渡す」側にある。開く方へ倒すと、押すたびに一覧がさらに伸びる
- **展開するのは全部閉じている時だけにする。** 上の裏返し。この形なら、押し続けた時に「全閉 → 全開 → 全閉」と往復する
- **状態を自前で持たず、押すたびに DOM から読む。** 個々のセクションは手でも開閉できるため、覚えておいた状態はすぐ実態とずれる
- **判定に `[data-for="section"]` の `aria-expanded` を使う。** `collapsed` クラスは子要素の `a.courseindex-chevron` に付くもので、セクション自身には付かない
- **`MutationObserver` で `aria-expanded` の変化を追い、ラベルを合わせる。** 個別に開閉した直後でも、ボタンの表示が次に何をするかを正しく示す。自分ではこの属性を書き換えないため、監視が自分の変更に反応することはない
- **標準のドロップダウンボタンを隠す。** 中身は展開と折りたたみの2つだけで、トグルに置き換えれば役目が残らない。ボタンを消しても Moodle 側のリンクは DOM に残るため、`click()` で呼べる
- **リンクの `click()` を呼び、開閉そのものは Moodle に任せる。** 各セクションの `aria-expanded` を自分で書き換えると、Moodle が持つ表示状態の記録と食い違う
- **設定を持たない。** 仕様書（[`../../features/course-page/index-toggle.md`](../../features/course-page/index-toggle.md)）に設定項目が無い
- **format-weeks 以外のフォーマットは未確認。** 採取したコースが週フォーマットのみで、セクションの構造が同じかどうかは確かめられていない
