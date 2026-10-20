# settings panel モジュール

## 概要

拡張機能のすべての設定を1枚の画面で編集する。ツールバーのポップアップと、ブラウザの拡張機能管理から開く設定ページの両方が、同じ画面をそのまま表示する。項目のラベルや UI の種類といった表示上の情報は、このモジュールが1箇所へ集める。

## 関連

- 使う: [`../utils/settings.md`](../utils/settings.md) — 編集対象のストレージ項目。ここが export する `<機能><設定名>Setting` を読み書きする
- 使う: [`../utils/theme.md`](../utils/theme.md) — OS のカラースキームに合わせた `dark` クラスの付け外し
- 使う: [`./menuFields.md`](./menuFields.md) — 時限表・カウントダウン・メニュー項目の専用エディタ
- 資料: [`../../features/ui/settings.md`](../../features/ui/settings.md) — 画面の目的と、ポップアップで兼ねる方針
- 参考: [`../README.md`](../README.md) — スタイリングの節。shadcn のコンポーネントを入れて組み合わせる

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/settings/types.ts` | 表示メタの型と `defineGroup` |
| `src/features/settings/fields.ts` | 全設定項目の表示メタを集約する |
| `src/features/settings/SettingsPanel.svelte` | タブとグループの描画 |
| `src/features/settings/FieldRow.svelte` | 項目1件の描画 |
| `src/entrypoints/popup/index.html` | ポップアップの入れ物 |
| `src/entrypoints/popup/main.ts` | ポップアップの起動 |
| `src/entrypoints/popup/App.svelte` | `SettingsPanel` を置く |
| `src/entrypoints/popup/app.css` | WXT のテンプレート由来のため削除する |
| `src/entrypoints/options/index.html` | 設定ページの入れ物 |
| `src/entrypoints/options/main.ts` | 設定ページの起動 |
| `src/entrypoints/options/App.svelte` | `SettingsPanel` を置く |

## インターフェース

```ts
// src/features/settings/types.ts
import type { Component } from "svelte";
import type { WxtStorageItem } from "wxt/utils/storage";

export type SettingsCategory = "ui" | "home" | "myCourses" | "coursePage";

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomFieldProps<V> {
  value: V;
  onChange: (next: V) => void;
}

export type FieldControl<V> =
  | { kind: "toggle" }
  | { kind: "number"; min: number; max: number; step?: number; unit?: string }
  | { kind: "text"; placeholder?: string }
  | { kind: "date" }
  | { kind: "select"; options: readonly SelectOption[] }
  | { kind: "nested"; fields: FieldsOf<V> }
  | { kind: "custom"; component: Component<CustomFieldProps<V>> };

export interface FieldMeta<V = unknown> {
  label: string;
  description?: string;
  control: FieldControl<V>;
}

export type FieldsOf<C> = { [K in keyof C]-?: FieldMeta<C[K]> };

export interface SettingsGroup {
  readonly id: string;
  category: SettingsCategory;
  title: string;
  fields: Record<string, FieldMeta>;
  footer?: Component;
  read: () => Promise<Record<string, unknown>>;
  write: (key: string, value: unknown) => Promise<void>;
}

export function defineGroup<C extends object>(
  category: SettingsCategory,
  title: string,
  setting: WxtStorageItem<C, Record<string, unknown>>,
  fields: FieldsOf<C>,
  footer?: Component,
): SettingsGroup;

export const CATEGORY_LABELS: Record<SettingsCategory, string>;
```

画面を描くコンポーネント:

```svelte
<!-- src/features/settings/SettingsPanel.svelte -->
<!-- props を取らない。settingsGroups を直接 import する -->
```

```svelte
<!-- src/features/settings/FieldRow.svelte -->
<script lang="ts">
  interface Props {
    meta: FieldMeta;
    value: unknown;
    onChange: (next: unknown) => void;
  }
</script>
```

`FieldRow` は `unknown` だけを扱う。型が閉じているのは `defineGroup` の中だけで、描画側は値の型を知らない。

集約する側:

```ts
// src/features/settings/fields.ts
export const settingsGroups: readonly SettingsGroup[] = [
  defineGroup("home", "不要な要素の非表示", homeHideElementsSetting, {
    announcements: { label: "お知らせ", control: { kind: "toggle" } },
    categories: { label: "コースカテゴリ", control: { kind: "toggle" } },
    search: { label: "コース検索", control: { kind: "toggle" } },
  }),
  defineGroup(
    "coursePage",
    "セクションの並び順",
    coursePageReverseSectionsSetting,
    {
      enabled: {
        label: "最新の回を一番上に表示する",
        control: { kind: "toggle" },
      },
    },
  ),
];
```

描画する側:

```svelte
<!-- src/entrypoints/popup/App.svelte と options/App.svelte は同じ中身 -->
<script lang="ts">
  import SettingsPanel from "@/features/settings/SettingsPanel.svelte";
</script>

<SettingsPanel />
```

```ts
// src/entrypoints/popup/main.ts と options/main.ts は同じ中身
import { mount } from "svelte";
import App from "./App.svelte";
import { syncColorScheme } from "@/utils/theme";
import "@/assets/global.css";

syncColorScheme();

const app = mount(App, { target: document.getElementById("app")! });

export default app;
```

## 処理の流れ

### 事前に入れる shadcn のコンポーネント

```sh
pnpm dlx shadcn-svelte@latest add tabs switch input select label separator
```

`src/lib/components/ui/` は CLI が生成する。手で書かない。

### defineGroup

グループの `id` は WXT の保存項目が持つ `setting.key` から取得する。表示文言を変えても識別は変わらず、別の ID 定義を増やさない。保存先のキーやデータ形式の変更は伴わない。

1. 渡された `fields` を `Record<string, FieldMeta>` として保持する。ここで型引数 `C` を落とす。**代入にはキャストが要る**
2. `read` は `setting.getValue()` の結果を返す。**ここにもキャストが要る**
3. `write(key, value)` は `setting.getValue()` で現在値を読み、`key` だけを差し替えた値を `setting.setValue()` で書く。ここはキャスト不要

型を落とす2箇所は次のように書く。

```ts
const erasedFields = fields as Record<string, FieldMeta>;
const read = () => setting.getValue() as Promise<Record<string, unknown>>;
```

キャストが避けられない理由は下の決めごとに書く。

### SettingsPanel

1. `settingsGroups` を読み、`CATEGORY_LABELS` のキー順にタブを作る
2. 各タブへ、そのカテゴリに属するグループを `fields.ts` に並べた順で置く
3. グループごとに `title` の見出しを出し、`fields` の各エントリを `FieldRow` で描く。`footer` を持つグループは、項目の下にそれを置く
4. 表示前に各グループの `read()` を呼び、`id` をキーとして値を保持する。`title` は見出し表示に使う
5. `FieldRow` から変更が届いたら、そのグループの `write(key, value)` を呼び、手元の値も更新する

### FieldRow

`meta.control.kind` で描き分ける。

| kind | 使うコンポーネント |
|---|---|
| `toggle` | shadcn の Switch |
| `number` | shadcn の Input（`type="number"`、`min`・`max`・`step` を渡す。`unit` は入力欄の右に添える） |
| `text` | shadcn の Input |
| `date` | shadcn の Input（`type="date"`。値は `YYYY-MM-DD` の文字列） |
| `select` | shadcn の Select |
| `nested` | `FieldRow` 自身を各キーに対して呼ぶ（下記） |
| `custom` | `meta.control.component` を `value` と `onChange` を渡して描く |

`nested` の場合、`value` を `Record<string, unknown>` として扱い、`meta.control.fields` の各キー `k` について次を渡す。

| 渡すもの | 値 |
|---|---|
| `meta` | `meta.control.fields[k]` |
| `value` | `value[k]` |
| `onChange` | `(sub) => onChange({ ...value, [k]: sub })` |

子の変更を親のオブジェクトへ畳み込んでから、さらに上へ渡す。これを繰り返すと、最上位の `onChange` にはトップレベルのキーの値が丸ごと届き、`group.write(key, value)` がそのまま使える。

### レスポンシブ

`SettingsPanel` のルート要素へ `mx-auto w-full min-w-96 max-w-3xl p-4` を当てる。ポップアップでは最小幅の 384px で開き、設定ページでは最大 768px の中央寄せになる。項目は幅にかかわらず1列に並べる。

## 決めごと

- **表示メタは `fields.ts` が1箇所で持ち、`src/features/` の各機能は設定の型だけを持つ。** 機能側が UI の文言を持つと、ラベルの統一と並び順の調整が機能ごとに散らばる
- **`FieldsOf<C>` で全キー分の `FieldMeta` を要求する。** 機能側の Config にキーを足すと `fields.ts` がコンパイルエラーになり、書き忘れが型で止まる
- **`defineGroup` の戻り値は型引数を落とした `SettingsGroup` にする。** 型の違うグループを1つの配列へ並べるため。読み書きは `defineGroup` の中で型が閉じており、描画側は `unknown` だけを見る
- **型を落とす2箇所はキャストで書く。安全性を手放す境界がここだと決める。** `FieldsOf<C>` から `Record<string, FieldMeta>` への代入は、`kind: "custom"` の `Component<CustomFieldProps<V>>` が `V` について不変（`value` と `onChange` の両方で `V` を使うため）で、`Component` 自体も Props に対して反変になるため、キャスト無しでは通らない。`setting.getValue()` の `Promise<C>` も、`C extends object` の制約だけでは `Promise<Record<string, unknown>>` へ代入できない。どちらも `tsc --strict` で確認済み
- **キャストは `defineGroup` の中だけに閉じる。** 呼び出し側（`fields.ts`）は型が効いた状態で書き、描画側は `unknown` しか見ない。境界を1つの関数へ集めることで、型が緩む範囲をそこだけに限る
- **値の型と `control` の種類の整合は型で縛らない。** `boolean` のキーに `kind: "number"` を書いても型は通る。完全に縛ると `FieldControl` が条件型だらけになり、読めなくなるほうの害が大きい
- **保存は操作した瞬間に行う。** 保存ボタンを置かない。ポップアップは外側をクリックすると閉じるため、未保存の状態を抱えると消える
- **設定の変更は Moodle のページを読み込み直した時に効く。** content script から storage を監視せず、再適用もしない。監視と再適用を入れると、すべての機能に「途中から適用し直せる」実装を要求することになる
- **ポップアップと設定ページは同じ `SettingsPanel` を出す。** 画面を2つ持たない。`main.ts` と `App.svelte` は entrypoint ごとに必要なため2組できるが、どちらも中身は同じで、画面の実体は `src/features/settings/` にだけある
- **`app.css` を削除し、`@/assets/global.css` へ寄せる。** WXT のテンプレートが置いた配色と余白が shadcn のテーマと衝突する
- **カテゴリはリポジトリ直下の [README.md](../../../README.md) の機能一覧と同じ4分類にする。** 探す時の地図を README と揃える
- **`kind: "custom"` は、配列やオブジェクトのように汎用のコントロールで表せない項目のために置く。** 時限表・カウントダウン・隠すメニュー項目がこれにあたり、専用エディタは [`./menuFields.md`](./menuFields.md) が持つ
- **`footer` は、値の編集にあたらない操作を置くために持つ。** `.ics` の書き出しボタン（[`./timetableFields.md`](./timetableFields.md)）のような、設定のキーに対応しない要素が入る。`fields` はキーと1対1で対応させ、そこへ操作を混ぜない
- **設定の検索、インポートとエクスポート、プロファイルの切り替えは作らない。** 仕様書に無い
- **画面自体の設定（テーマの手動切り替えなど）は持たない。** 仕様書が「この画面自体の設定はない」と定めている
