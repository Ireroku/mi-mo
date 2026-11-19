# quickDrawer モジュール

## 概要

右のブロックドロワーに対して、隠すか、よく使うコースの入口に作り変えるかを選べるようにする。隠す方は CSS だけで行い、ピン留めは独自のブロックをドロワーの先頭へ差し込む。ドロワーへ足すブロックの外枠（`DrawerBlock.svelte`）と、差し込み先のセレクタもここが持つ。

## 関連

- 使う: [`../utils/styleSheet.md`](../utils/styleSheet.md) — 隠すための CSS の注入
- 使う: [`../moodle/courseList.md`](../moodle/courseList.md) — `CourseRef` の型
- 使う: [`../utils/settings.md`](../utils/settings.md) — ストレージ項目を足す手順
- 資料: [`../../moodle/drawer.md`](../../moodle/drawer.md) — ドロワーのセレクタ、開閉状態の現れ方、`course_list` の構造
- 参考: [`../menu/clock.md`](../menu/clock.md) — `createShadowRootUi` で要素を差し込む書き方
- 参考: [`../menu/drawerClock.md`](../menu/drawerClock.md) — 同じ外枠と差し込み先を使う時計のブロック。ピン留めより上に置く

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/ui/quickDrawer.ts` | 設定の型、CSS の組み立て、ピン留めブロックの差し込み |
| `src/features/ui/PinnedCourses.svelte` | ピン留めしたコースの一覧の描画 |
| `src/features/ui/DrawerBlock.svelte` | ドロワーへ足すブロックの外枠と見出し |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/early.content.ts` | 隠す CSS を当てる |
| `src/entrypoints/shared.content.ts` | ピン留めブロックを差し込む |

## インターフェース

```ts
// src/features/ui/quickDrawer.ts
import type { CourseRef } from "@/moodle/courseList";

export interface QuickDrawerConfig {
  hidden: boolean;
  pinned: CourseRef[];
}

// ドロワーの中でブロックが並ぶ場所。ほかの機能がドロワーへブロックを足す時も使う
export const DRAWER_REGION_SELECTOR = "#theme_boost-drawers-blocks #block-region-side-pre";

export function applyQuickDrawerVisibility(config: QuickDrawerConfig): void;

export async function initPinnedCourses(
  ctx: ContentScriptContext,
  config: QuickDrawerConfig,
): Promise<void>;
```

```ts
// PinnedCourses.svelte の Props
interface Props {
  courses: CourseRef[];
}
```

```ts
// DrawerBlock.svelte の Props
interface Props {
  title: string;
  children: Snippet;
}
```

設定の定義:

```ts
// src/utils/settings.ts
export const uiQuickDrawerSetting = defineSetting<QuickDrawerConfig>(
  "local:ui.quickDrawer",
  { fallback: { hidden: false, pinned: [] } },
);
```

entrypoint からの呼び出し。2つの entrypoint に分かれます。どちらも、このモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/early.content.ts
const config = await uiQuickDrawerSetting.getValue();
applyQuickDrawerVisibility(config);
```

```ts
// src/entrypoints/shared.content.ts
const config = await uiQuickDrawerSetting.getValue();
if (!config.hidden && config.pinned.length > 0) {
  await initPinnedCourses(ctx, config);
}
```

## 処理の流れ

### applyQuickDrawerVisibility

1. `config.hidden` が false の場合、空文字を `applyStyleSheet` へ渡して適用を解除する
2. true の場合、次の CSS を渡す。id は `mimo-ui-quick-drawer`

```css
#theme_boost-drawers-blocks,
[data-action="toggle"][data-target="theme_boost-drawers-blocks"] {
  display: none !important;
}
```

### initPinnedCourses

1. `DRAWER_REGION_SELECTOR` の要素を探す。無ければ何もせず戻る
2. `createShadowRootUi` で `PinnedCourses.svelte` を差し込む

| 設定 | 値 |
|---|---|
| `name` | `mimo-pinned-courses` |
| `position` | `inline` |
| `anchor` | 1 で見つけた要素 |
| `append` | `first` |

### PinnedCourses.svelte

1. `DrawerBlock` に「ピン留め」の見出しを付けて置く
2. 中へ `courses` をリンクとして縦に並べる。`href` は `CourseRef.url`、表示は `CourseRef.title`

### DrawerBlock.svelte

1. `section` を周囲のブロック（`section.block.card`）に合わせた外枠で置く。Shadow DOM の中には Moodle の `.card` が届かないため、Moodle のブロックを測った値（枠 `rgba(0,0,0,.125)`、角丸 8px、白地、内側の余白 16px、下の間隔 16px）を Tailwind のクラスで書く。Tailwind の `rounded-lg` などはテーマの変数（`--radius`）から決まり、Moodle の値とずれる（実機で 7.2px になった）ため、寸法は px で書く
2. `title` を見出し（Moodle のブロックの見出しと同じ 16.8px・太字、下の間隔 12px）として出し、その下へ `children` を描く

## 決めごと

- **隠す時は開くボタンも一緒に隠す。** ドロワー本体だけを消すと、開くボタンだけが残り、押しても何も出ない状態になる
- **隠す処理は `document_start`、ピン留めは `document_idle` で行う。** 隠す方は CSS だけで済み、早いほど描画されずに消える。差し込む方はドロワーの DOM が要る
- **隠す設定が入っている間はピン留めを差し込まない。** 隠したドロワーの中に要素を足しても見えない
- **ピン留めを独自のブロックとして先頭へ足し、`course_list` は触らない。** 既存のブロックへ割り込むと、Moodle 側の並びや表示状態と競合する
- **`createShadowRootUi` を使う。** ドロワー内のブロックには Moodle のスタイルが強く当たっており、素の要素を置くと見た目が揃わない
- **ピン留めの編集は設定画面で行い、Moodle のページ上に操作を置かない。** ページ側にボタンを置くと、機能から設定を書き戻す経路が要る。設定の読み取りを entrypoint に集める方針から外れる
- **ピン留めするコースは [`../moodle/courseList.md`](../moodle/courseList.md) の控えから選ぶ。** コースIDを手で入力させない
- **開閉状態を拡張機能から操作しない。** Moodle がユーザー設定として記憶しており、こちらが触ると食い違う。判定が必要な場面では `#theme_boost-drawers-blocks` の `show` クラスを見る（`body` のクラスには出ない）
- **ドロワーが出ないページでは何もしない。** 差し込み先が無ければ戻るだけにする
- **ドロワーへ足すブロックは `DrawerBlock.svelte` の外枠を共有する。** ピン留めと時計のブロックで、余白と見出しの形を揃えるため
