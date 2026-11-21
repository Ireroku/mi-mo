# indexToggle モジュール

## 概要

コースインデックスの一括開閉を、1つのトグルボタンにまとめる。標準ではドロップダウンを開いて「すべてを展開する」「すべてを折りたたむ」のどちらかを選ぶ形になっており、操作が2手かかる。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 標準のボタンを隠し、トグルの位置を決める CSS の注入
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
  state?: IndexState;
  onToggle: () => void;
}

export function setState(next: IndexState): void;
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
3. 標準のドロップダウンを隠し、トグルの位置を決める CSS を `applyStyleSheet` へ渡す。id は `mimo-course-page-index-toggle`
4. `createShadowRootUi` で `IndexToggle.svelte` をマウントする
5. `#course-index` の `aria-expanded` の変化を `MutationObserver` で監視し、変わるたびに `readIndexState()` を読み直してボタンへ渡す。`ctx.onInvalidated` で `disconnect` する

| 設定 | 値 |
|---|---|
| `name` | `mimo-index-toggle` |
| `position` | `inline` |
| `anchor` | `#theme_boost-drawers-courseindex .drawerheader` |
| `append` | `last` |
| `inheritStyles` | `true` |

### 注入する CSS

標準のボタンを隠し、トグルの位置をブラウザが描いた結果へ合わせる。

```css
body.pagelayout-course #courseindexdrawercontrolsmenubutton {
  display: none !important;
}
#theme_boost-drawers-courseindex .drawercontent {
  scrollbar-gutter: stable;
}
@supports (anchor-name: --a) {
  #course-index .courseindex-section-title {
    anchor-name: --mimo-index-item;
  }
  mimo-index-toggle {
    position: absolute;
    align-self: center;
    right: anchor(--mimo-index-item right);
  }
}
```

右端は一覧のセクション名の行の右端に揃い、縦はヘッダの中央（閉じるボタン（×）と同じ高さ）に来る。アンカー配置に対応しないブラウザでは `@supports` の中が無視され、ヘッダの右端に並ぶ。

### IndexToggle.svelte

`state` が `allCollapsed` なら「すべて開く」、それ以外なら「すべて閉じる」と出す。初期値は `allExpanded` とし、`setState` は同じ表示用の値を更新する。ボタンは shadcn-svelte の `Button` を `variant="ghost"` `size="sm"` で描き、文言の左へ開閉を表すアイコン（lucide の `ChevronsUpDown`・`ChevronsDownUp`）を置く。隣の閉じるボタン（×）が枠の無いアイコンのため、普段は枠も面も見せない。内側の余白（0.5rem）、透明な 1px の枠、角の丸み（0.5rem）はコースインデックスの項目（`.courseindex-item`）と同じにする（`h-auto p-2 border border-transparent rounded-[0.5rem]`）。押されたら `onToggle` を呼び、呼び出し側がその時点の DOM を読み直す。セクションが無ければ開閉を実行しない。

## 決めごと

- **混在している時は折りたたむ方へ倒す。** コースインデックスは回の数だけ縦に伸びるため、いくつか開いた状態からボタンを押す動機は「散らかったものを畳んで全体を見渡す」側にある。開く方へ倒すと、押すたびに一覧がさらに伸びる
- **展開するのは全部閉じている時だけにする。** 上の裏返し。この形なら、押し続けた時に「全閉 → 全開 → 全閉」と往復する
- **状態を自前で持たず、押すたびに DOM から読む。** 個々のセクションは手でも開閉できるため、覚えておいた状態はすぐ実態とずれる
- **コンポーネントは表示用の値を1つだけ持つ。** 初期値と監視結果は同じ値へ渡し、開閉方向の判断には使わない。TS 側に状態のコピーを置かず、クリック時の DOM を正本にする
- **判定に `[data-for="section"]` の `aria-expanded` を使う。** `collapsed` クラスは子要素の `a.courseindex-chevron` に付くもので、セクション自身には付かない
- **`MutationObserver` で `aria-expanded` の変化を追い、ラベルを合わせる。** 個別に開閉した直後でも、ボタンの表示が次に何をするかを正しく示す。自分ではこの属性を書き換えないため、監視が自分の変更に反応することはない
- **標準のドロップダウンボタンを隠す。** 中身は展開と折りたたみの2つだけで、トグルに置き換えれば役目が残らない。ボタンを消しても Moodle 側のリンクは DOM に残るため、`click()` で呼べる
- **リンクの `click()` を呼び、開閉そのものは Moodle に任せる。** 各セクションの `aria-expanded` を自分で書き換えると、Moodle が持つ表示状態の記録と食い違う
- **ボタンを shadcn-svelte の `Button` で描き、Bootstrap のクラスを使わない。** Shadow DOM の中には Moodle の Bootstrap が届かない。`btn btn-secondary btn-sm` を付けても装飾が当たらず、文字だけが表示される
- **右端を数値で書かず、CSS のアンカー配置で一覧の項目に合わせる。** 一覧のスクロールバーの幅は OS と設定で 0 から 17px ほどまで変わり、定数の余白ではどこかの環境でずれる。ブラウザが描いた位置を参照すれば、スクロールバーの出入りや Moodle 側の余白の変更にも追従する。JS で位置を読んで書く方法より、持つコードが少ない
- **縦はアンカーを使わず、`align-self: center` でヘッダの中央に置く。** ヘッダは `display: flex` で、その直下の絶対位置の要素は `top` を書かなければ `align-self` で縦の位置が決まる。× にアンカーを付けて `align-self: anchor-center` で揃えた形では、Chrome でドロワーの開閉のアニメーション中にアンカーを見失い、ボタンが上へ張り付いた
- **一覧に `scrollbar-gutter: stable` を当てる。** Chrome で常に表示するスクロールバーの場合、セクションの開閉で一覧の長さがドロワーの高さを越えるたびにスクロールバーが出入りし、項目の右端とボタンが一緒にずれた。スクロールバーの場所を常に空ければ、一覧の幅が変わらない。スクロールバーが幅を取らない環境（macOS のスクロール時に表示）では空く幅も 0 になる
- **ボタンの箱を項目の箱と同じ形にする。** 余白・枠・角の丸みが同じなら、右端を揃えた時に、ホバーの面が青い項目の枠と重なり、文言の右端も項目の文字の右端と揃う。値は Moodle 4.5 の `theme/boost/scss/moodle/courseindex.scss` の `.courseindex-item` から取った
- **ボタンを `.drawerheader` の直下へ置く。** 元のボタンの隣（`.dropdown` の中）は Bootstrap が `position: relative` を当てており、そこが位置の基準になる。基準の中に一覧が無いと、項目をアンカーとして参照できない。ヘッダは `position: static` のため、直下に置けば基準はドロワー（`position: fixed`）になる
- **`inheritStyles: true` にする。** WXT は既定で Shadow DOM の入れ物へ `:host { all: initial !important; }` を当てる。内側の `!important` は外のどの指定にも勝つため、入れ物へ書いた `position` などが消える。中のボタンは Tailwind が文字の設定を当て直すので、ページの文字の設定を継承しても見た目は変わらない
- **設定を持たない。** 仕様書（[`../../features/course-page/index-toggle.md`](../../features/course-page/index-toggle.md)）に設定項目が無い
- **format-weeks 以外のフォーマットは未確認。** 採取したコースが週フォーマットのみで、セクションの構造が同じかどうかは確かめられていない
