# mountShadowUi モジュール

## 概要

Svelte コンポーネントを Shadow DOM の中へ描画し、ページの要素の位置へ差し込む。WXT の `createShadowRootUi` と Svelte の `mount` / `unmount` の組み合わせを1か所に置き、Shadow DOM で部品を足す機能が共有する。

## 関連

- 参考: [`../README.md`](../README.md) — 「WXT と Svelte の前提」の節。Shadow DOM の中で CSS とテーマが効く仕組み
- 使う: [`../menu/clock.md`](../menu/clock.md)、[`../menu/countdownBadge.md`](../menu/countdownBadge.md)、[`../menu/drawerClock.md`](../menu/drawerClock.md) — メニューのバッジとドロワーのブロック
- 使う: [`../home/greeting.md`](../home/greeting.md)、[`../timetable/panel.md`](../timetable/panel.md) — ホームの挨拶と時間割
- 使う: [`../ui/quickDrawer.md`](../ui/quickDrawer.md) — ピン留めしたコースのブロック
- 使う: [`../coursePage/autoattendButton.md`](../coursePage/autoattendButton.md)、[`../coursePage/autoattendStats.md`](../coursePage/autoattendStats.md)、[`../coursePage/indexToggle.md`](../coursePage/indexToggle.md) — コースページのボタンと出席状況

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/mountShadowUi.ts` | UI の作成、コンポーネントの描画と片付け |

## インターフェース

```ts
// src/utils/mountShadowUi.ts
export interface ShadowUiOptions {
  name: string;
  anchor: string | Element;
  append: ContentScriptAppendMode;
  inheritStyles?: boolean;
}

export async function mountShadowUi<Props, Exports>(
  ctx: ContentScriptContext,
  options: ShadowUiOptions,
  component: Component<Props, Exports>,
  props: Props,
): Promise<ShadowRootContentScriptUi<Exports>>;
```

使用例:

```ts
import { mountShadowUi } from "@/utils/mountShadowUi";

await mountShadowUi(
  ctx,
  { name: "mimo-timetable", anchor: container, append: "last" },
  Timetable,
  { config, periods, schedule },
);
```

コンポーネントが export する関数は、戻り値の `mounted` から呼ぶ。

```ts
const ui = await mountShadowUi(ctx, { /* ... */ }, IndexToggle, { /* ... */ });
ui.mounted?.setState(next);
```

## 処理の流れ

1. `options` に `position: "inline"` を足して `createShadowRootUi` を呼ぶ
2. `onMount` で `component` を `props` とともに `mount` し、その戻り値を UI の `mounted` にする
3. `onRemove` で `mounted` があれば `unmount` する。UI を外した時と、`ctx` が無効になった時に呼ばれる
4. `ui.mount()` で差し込み、UI を返す

## 決めごと

- **`position` は `inline` に固定する。** 呼び出し側はどれもページの要素の流れの中へ置く。`overlay` や `modal` を使う機能が現れた時に選べるようにする
- **WXT の選択肢のうち、呼び出し側が実際に使うものだけを `ShadowUiOptions` に載せる。** 載せていないものが要る時に足す
- **`props` は呼ぶ時に1度だけ渡す。** 後から値を変える場合は、コンポーネントが export する関数を `mounted` から呼ぶ
- **Moodle に依存しないため `src/utils/` に置く。** 差し込み先は呼び出し側が決め、このモジュールはセレクタを持たない
- **Shadow DOM を使わずに素の DOM で足す機能は、このモジュールを使わない。** 数の多い要素を足す [`../coursePage/gradeInline.md`](../coursePage/gradeInline.md) などは、UI を回数分作ると重いため
