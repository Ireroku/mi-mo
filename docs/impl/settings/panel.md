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

export type SettingsCategory = "home" | "course" | "general";

export interface SelectOption<V extends string = string> {
  value: V;
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
  | {
      kind: "select";
      // 値が文字列のユニオンなら、選択肢の value もそのユニオンに限る
      options: readonly SelectOption<[V] extends [string] ? V : string>[];
    }
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
  defineGroup("home", "ホームから隠すもの", homeHideElementsSetting, {
    announcements: { label: "お知らせ", control: { kind: "toggle" } },
    categories: { label: "コースカテゴリ", control: { kind: "toggle" } },
    search: { label: "コース検索", control: { kind: "toggle" } },
  }),
  defineGroup("course", "セクションの並び順", coursePageReverseSectionsSetting, {
    enabled: {
      label: "最新の回を一番上に並べる",
      control: { kind: "toggle" },
    },
  }),
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
pnpm dlx shadcn-svelte@latest add tabs switch input label button
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

1. 全グループの `read()` を `Promise.all` で呼び、`id` をキーとして値を保持する。待つ間は「設定を読み込み中...」を出す
2. 読み込みに失敗した場合は、メッセージと「再試行」ボタンを `role="alert"` の中に出す。ボタンは手順1をやり直す
3. `CATEGORY_LABELS` のキー順にタブを作る（ホーム・コース・全体）
4. 各タブへ、そのカテゴリに属するグループを `fields.ts` に並べた順で置く。置き方は下の「グループの置き方」に従う
5. `FieldRow` から変更が届いたら、下の「保存」に従って書き込む

#### グループの置き方

グループを1枚のカード（角丸の白い面）にし、カードの上へ `title` を小さな見出しとして出す。項目はカードの中へ1行ずつ並べ、行の間を線で区切る。線は左端だけを行の文字の位置へ揃え、右端はカードの端まで引く。

グループの形から、次の2通りを選ぶ。選ぶのは `SettingsPanel` で、`fields.ts` は形を指定しない。

| グループの形 | 置き方 |
|---|---|
| 項目がトグル1つだけで、`footer` を持たない | 隣り合う同じ形のグループと1枚のカードへまとめ、1行ずつ並べる。行の文言は項目の `label`。見出しは出さない |
| それ以外 | グループごとに1枚のカードにする。見出しは `title` |

カードにするグループが `enabled` という名前のトグルを持つ場合、それを機能全体の入り切りとして扱う。

1. `enabled` の行は、他の項目と同じ形でカードの中に描く。`fields.ts` で先頭に書く
2. `enabled` が false の間は、`enabled` の行だけを描く。残りの項目と `footer` は描かない

#### 保存

1. 変更前の値を控え、手元の値を先に新しい値へ更新する
2. 書き込みを1本の `Promise` の鎖（`saveQueue`）の末尾へ足す。前の書き込みが終わってから `group.write(key, value)` を呼ぶ
3. 書き込みが失敗した場合、`console.error("[mi-mo] settings", error)` を出し、手元の値を控えた値へ戻す。タブの下に「`<title>`」を保存できなかった旨を `role="alert"` で出す
4. 次に何かを操作した時点で、そのメッセージを消す

### FieldRow

`meta.control.kind` で描き分ける。

| kind | 使うコンポーネント |
|---|---|
| `toggle` | shadcn の Switch |
| `number` | shadcn の Input（`type="number"`、`min`・`max`・`step` を渡す。`unit` は入力欄の右に添える）。確定（`change`）の時点で `min` と `max` の間へ丸めてから保存する。数として読めない入力は元の値へ戻す |
| `text` | shadcn の Input |
| `date` | shadcn の Input（`type="date"`。値は `YYYY-MM-DD` の文字列） |
| `select` | ネイティブの `<select>` |
| `nested` | `label` を小さな見出しとして出し、その下へ `FieldRow` 自身を各キーに対して呼ぶ（下記）。子の行は字下げせず、他の行と同じ形で並べる |
| `custom` | `<details>` の中へ、`meta.control.component` を `value` と `onChange` を渡して描く。閉じた状態を既定にする。`<summary>` には `label`・`description` と、値が配列の場合はその件数（「6件」）を出す |

`nested` の場合、`value` を `Record<string, unknown>` として扱い、`meta.control.fields` の各キー `k` について次を渡す。

| 渡すもの | 値 |
|---|---|
| `meta` | `meta.control.fields[k]` |
| `value` | `value[k]` |
| `onChange` | `(sub) => onChange({ ...value, [k]: sub })` |

子の変更を親のオブジェクトへ畳み込んでから、さらに上へ渡す。これを繰り返すと、最上位の `onChange` にはトップレベルのキーの値が丸ごと届き、`group.write(key, value)` がそのまま使える。

### 画面の骨組み

上から、画面の名前と1行の説明、タブ、選んだタブの中身の順に置く。名前からタブまでは `sticky` で画面の上端に残し、スクロールしてもタブを押せるようにする。保存の失敗もこの中に出す。タブを切り替えたら、スクロール位置を先頭へ戻す。

背景は `bg-muted`、カードは `bg-card` にし、面の明るさの差でまとまりを見せる。カードに枠線と影は付けない。ダークでは背景を `bg-background` にする。

中身の幅は `max-w-2xl`（672px）の中央寄せにする。項目は幅にかかわらず1列に並べる。

ポップアップは `src/entrypoints/popup/index.html` の `body` へ当てるスタイルで、幅 500px・高さ 600px に固定する。ポップアップは中身に合わせて伸び縮みするため、固定しないとタブを切り替えるたびに大きさが変わる。

### 文字の大きさと強弱

| 役割 | クラス | 大きさ |
|---|---|---|
| 画面の名前 | `text-lg font-semibold` | 18px |
| 項目の `label`、入力した値 | `text-row` | 15px |
| `description`、カードの見出し、件数、単位 | `text-note text-muted-foreground` | 13px |

`text-row` と `text-note` は `src/assets/global.css` の `@theme` に置く。設定画面では 13px より小さい文字を使わない。太字は画面の名前だけに使い、行の中では色の濃淡だけで主従を付ける。

### 行の形

行の高さは 48px 以上にする（`min-h-12 py-3`）。`text` 以外の項目は、左に `label` と `description`、右にコントロールを置く1行にする（`flex items-center justify-between gap-4`）。`text` だけは入力欄が長いため、`label` の下へ全幅で置く。

## 項目を足す時の規約

`fields.ts` へ項目を足す時は、次に従う。画面の密度と優先度を保つための規約で、型では縛れない。

- **機能全体を入り切りするトグルのキーは `enabled` にし、グループの先頭に書く。** 無効の間は、この行だけが残って詳細が畳まれる。別の名前にすると、無効な機能の詳細が並び続ける
- **入り切りしかない機能は、トグル1つだけのグループにし、同じ形のグループと隣り合わせに並べる。** 1枚のカードへまとまり、見出しだけのカードが縦に並ぶのを避けられる。見出しが出ないため、`label` だけで何が起きるかを言い切る
- **`label` は 18字前後に収める。** 右にコントロールが載るため、長いと折り返す。補足は `description` へ回す。カードの見出しが対象を示している場合は、名詞だけにする（「ホームから隠すもの」の下の「お知らせ」）
- **`description` は、ラベルだけでは結果が想像できない項目にだけ書く。** すべての項目へ書くと、読むべき説明が埋もれる
- **一覧や表を編集する項目は `custom` にする。** 閉じた状態で件数だけが見え、開いた人だけが中身を読む
- **1つのグループの項目は7つ前後までにする。** 超える場合は、`nested` でまとめるか、グループを分ける
- **よく変える項目を上、一度決めたら触らない項目を下に置く。** `fields.ts` に並べた順がそのまま表示順になる。タブの中のグループの順も同じ規則で決める
- **選択肢が2つで「する・しない」と読める場合は `toggle`、それ以外は `select` にする。** ラジオボタンは使わない

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
- **タブは「ホーム」「コース」「全体」の3つにする。** 効果が現れる Moodle の画面で分ける。README の機能一覧は4分類になっている。そのうちマイコースは項目が1つしか無く、タブにすると中身が1行になる。マイコースとコースページを「コース」へまとめる
- **見た目は、OS の設定アプリと同じ「まとまりごとのカードに行を並べる」形にする。** 左に名前、右にコントロールという行の形が全項目で揃い、どこを見れば値が分かるかを覚え直さずに済む
- **機能の入り切りを、見出しの横ではなくカードの先頭の行に置く。** 入り切りも設定の1つで、他の行と同じ位置にスイッチがある方が見つけやすい
- **主色（`--primary`）を Moodle のリンク色（`#0f6cbf`）にする。** 有効なスイッチと主要なボタンに使う。Moodle へ差し込む部品も同じテーマを使うため、Moodle の画面の中で色が揃う
- **`kind: "custom"` は、配列やオブジェクトのように汎用のコントロールで表せない項目のために置く。** 時限表・カウントダウン・隠すメニュー項目がこれにあたり、専用エディタは [`./menuFields.md`](./menuFields.md) が持つ
- **`footer` は、値の編集にあたらない操作を置くために持つ。** `.ics` の書き出しボタン（[`./timetableFields.md`](./timetableFields.md)）のような、設定のキーに対応しない要素が入る。`fields` はキーと1対1で対応させ、そこへ操作を混ぜない
- **`select` はネイティブの `<select>` で描く。** shadcn の Select は選択肢を別の層へ描くため、高さの限られたポップアップでは切れる場合がある。ネイティブの部品は OS が描くため切れず、キーボード操作も OS の標準に従う
- **保存を直列にする。** `write` は読む・差し替える・書くの3手で、同じグループの2項目を続けて変えると、並行した書き込みの後勝ちで先の変更が消える
- **失敗した保存は手元の値を巻き戻す。** 画面が保存されていない値を出し続けると、利用者は保存されたと受け取る
- **無効な機能の詳細を描かない。** 効かない項目を並べると、読む量だけが増える。有効にした時点で現れるため、探す手間は増えない
- **設定の検索、インポートとエクスポート、プロファイルの切り替えは作らない。** 仕様書に無い
- **画面自体の設定（テーマの手動切り替えなど）は持たない。** 仕様書が「この画面自体の設定はない」と定めている
