# autoattendButton モジュール

## 概要

コース内容に埋もれている出欠確認へのリンクを、決まった位置のボタンとして出す。コース最上部かフローティングのどちらかを設定で選ぶ。autoattend が置かれていないコースでは何も出さず、ボタンの有無がそのまま「出欠を取る授業かどうか」を表す。

## 関連

- 使う: [`../moodle/page.md`](../moodle/page.md) — コースページかどうかの判定
- 資料: [`../../moodle/course-page.md`](../../moodle/course-page.md) — 出席リンクのセレクタ、遷移先が別ページになる事情
- 参考: [`../menu/clock.md`](../menu/clock.md) — `createShadowRootUi` で要素を差し込む書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/coursePage/autoattendButton.ts` | 設定の型、リンクの探索、差し込み |
| `src/features/coursePage/AutoattendButton.svelte` | ボタンの描画 |
| `src/utils/settings.ts` | ストレージ項目の定義 |
| `src/entrypoints/shared.content.ts` | 設定を読み、機能を呼ぶ |

## インターフェース

```ts
// src/features/coursePage/autoattendButton.ts
export type AutoattendButtonPlacement = "top" | "floating";

export interface AutoattendButtonConfig {
  enabled: boolean;
  placement: AutoattendButtonPlacement;
}

export async function initAutoattendButton(
  ctx: ContentScriptContext,
  config: AutoattendButtonConfig,
): Promise<void>;
```

```ts
// AutoattendButton.svelte の Props
interface Props {
  href: string;
  placement: AutoattendButtonPlacement;
}
```

設定の定義:

```ts
// src/utils/settings.ts
export const coursePageAutoattendButtonSetting =
  storage.defineItem<AutoattendButtonConfig>(
    "local:coursePage.autoattendButton",
    { fallback: { enabled: true, placement: "top" } },
  );
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initAutoattendButton } from "@/features/coursePage/autoattendButton";
import { coursePageAutoattendButtonSetting } from "@/utils/settings";

const config = await coursePageAutoattendButtonSetting.getValue();
if (config.enabled) {
  await initAutoattendButton(ctx, config);
}
```

## 処理の流れ

1. `isCoursePage()` が false なら何もせず戻る
2. `#region-main li.activity.modtype_autoattendmod a.aalink` を探す。無ければ何もせず戻る
3. その `href` を取る
4. `placement` に応じた差し込み先で `createShadowRootUi` を呼び、`AutoattendButton.svelte` をマウントする

| `placement` | `anchor` | `append` |
|---|---|---|
| `top` | `#region-main div.course-content` | `before` |
| `floating` | `body` | `last` |

`name` はどちらも `mimo-autoattend-button`、`position` は `inline` を使う。

### AutoattendButton.svelte

1. shadcn の Button をリンクとして描く。文言は「出欠確認」
2. `placement` が `floating` の場合、ルート要素へ `position: fixed` と右下の配置を当てる。下からの距離は、ヒントボタン（[`../../moodle/common.md`](../../moodle/common.md)）と重ならない高さにする
3. `placement` が `top` の場合は通常の流れに置き、下に余白を取る

## 決めごと

- **元の出席リンクを消さない。** コース内容の一覧から消すと、ボタンを隠す設定にした時に辿り着けなくなる
- **リンクが見つからないコースでは何も出さない。** 仕様書が「ボタンの有無がそのまま答えになる」としており、出ないこと自体が情報になる
- **リンク先を書き換えず、`href` をそのまま使う。** 遷移先は `/blocks/autoattend/index.php?course=<courseid>` へリダイレクトされる別ページで、こちらで組み立て直す理由が無い
- **コースインデックス側のリンク（`#theme_boost-drawers-courseindex`）は使わない。** コース内容側と同じ場所へ飛ぶうえ、左ドロワーが閉じている場面では辿れない
- **フローティングの位置をヒントボタンの上にする。** ヒントボタンを隠していない場合に重なると、どちらも押しにくくなる
- **`createShadowRootUi` を使う。** ボタンの見た目を shadcn で揃えるため。Moodle の CSS が当たると `Button` の形が崩れる
- **`document_idle` で初期化する。** コース内容が描かれた後でなければリンクを探せない
- **出席受付中の画面は未確認。** 資料の採取が授業時間外に行われており、遷移先でコード入力が要るかどうかは分かっていない。このモジュールは遷移先に関与しないため実装には影響しないが、リンク先の挙動を前提にした機能を足す場合は先に確認する
