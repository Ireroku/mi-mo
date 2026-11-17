# settings panel モジュール

## 概要

拡張機能のすべての設定を1枚の画面で編集する。ツールバーのポップアップと、ブラウザの拡張機能管理から開く設定ページの両方が、同じ画面をそのまま表示する。項目のラベルや UI の種類といった表示上の情報は、このモジュールが1箇所へ集める。

## 関連

- 使う: [`../utils/settings.md`](../utils/settings.md) — 編集対象のストレージ項目。ここが export する `<機能><設定名>Setting` を読み書きする
- 使う: [`../utils/theme.md`](../utils/theme.md) — OS のカラースキームに合わせた `dark` クラスの付け外し
- 使う: [`./menuFields.md`](./menuFields.md) — 時限表・カウントダウン・メニュー項目の専用エディタ
- 使う: [`./timetableFields.md`](./timetableFields.md) — 時間割の専用エディタと、`footer` に置くファイルの出し入れと `.ics` の書き出しボタン
- 使う: [`../utils/download.md`](../utils/download.md) — バックアップのファイルを保存する `saveBlob`
- 資料: [`../../features/ui/settings.md`](../../features/ui/settings.md) — 画面の目的と、ポップアップで兼ねる方針
- 参考: [`../README.md`](../README.md) — スタイリングの節。shadcn のコンポーネントを入れて組み合わせる

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/settings/types.ts` | 表示メタの型と `defineGroup` |
| `src/features/settings/fields.ts` | 全設定項目の表示メタを集約する |
| `src/features/settings/SettingsPanel.svelte` | 全体のスイッチ、タブ、カード、別画面の描画 |
| `src/features/settings/FieldRow.svelte` | 項目1件の描画 |
| `src/features/settings/backup.logic.ts` | バックアップの組み立てと読み取り |
| `src/features/settings/BackupButtons.svelte` | バックアップの書き出しと読み込みのボタン |
| `src/utils/settings.ts` | 全体のスイッチ `extensionSetting` を定義する |
| `src/entrypoints/shared.content.ts` | 全体のスイッチが切れている間は何もせず戻る |
| `src/entrypoints/early.content.ts` | 同上 |
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
  section?: string; // この行を置くカードの見出し。省くとグループの title になる
  control: FieldControl<V>;
}

export type FieldsOf<C> = { [K in keyof C]-?: FieldMeta<C[K]> };

export interface SettingsGroup {
  readonly id: string;
  category: SettingsCategory;
  title: string;
  fields: Record<string, FieldMeta>;
  footer?: Component<FooterProps>;
  after?: string; // 行の id。その行の直後へ、このグループの行を差し込む
  read: () => Promise<Record<string, unknown>>;
  write: (key: string, value: unknown) => Promise<void>;
  replace: (value: Record<string, unknown>) => Promise<void>;
}

// footer が受け取る、全グループの今の値と、値を取り込む手段
export interface FooterProps {
  values: Record<string, Record<string, unknown>>;
  onRestore: (values: Record<string, Record<string, unknown>>) => Promise<void>;
}

export interface GroupOptions {
  footer?: Component<FooterProps>;
  after?: string;
}

// 行の id。`<グループの id>.<キー>` の形になる
export function rowId(groupId: string, key: string): string;

export function defineGroup<C extends object>(
  category: SettingsCategory,
  title: string,
  setting: WxtStorageItem<C, Record<string, unknown>>,
  fields: FieldsOf<C>,
  options?: GroupOptions,
): SettingsGroup;

export const CATEGORY_LABELS: Record<SettingsCategory, string>;
```

全体のスイッチ:

```ts
// src/utils/settings.ts
export interface ExtensionConfig {
  enabled: boolean; // false の間は、設定を残したまま全機能を止める
}

export const extensionSetting = storage.defineItem<ExtensionConfig>(
  "local:extension",
  { fallback: { enabled: true } },
);
```

```ts
// src/entrypoints/shared.content.ts と early.content.ts の main() の先頭
if (!(await extensionSetting.getValue()).enabled) {
  return;
}
```

バックアップ:

```ts
// src/features/settings/backup.logic.ts
// グループの id → そのグループの値
type Values = Record<string, Record<string, unknown>>;

export const BACKUP_FILENAME = "mi-mo-settings.json";

export interface BackupFile {
  app: "mi-mo";
  version: number;
  settings: Values;
}

export function buildBackup(values: Values): BackupFile;

// current は今の値。ファイルにあるグループだけを、取り込んだ後の値にして返す
export function parseBackup(text: string, current: Values): Values;

// 1つのグループの一部のキーだけを出し入れする範囲
export interface BackupScope {
  groupId: string;
  keys: readonly string[];
}

// 範囲に入るグループとキーだけを残して返す
export function narrowValues(values: Values, scope: BackupScope): Values;

// 範囲に入る値だけを取り込み、範囲の外のキーは今の値を残して、グループ全体の値を返す
export function parseScopedBackup(
  text: string,
  current: Values,
  scope: BackupScope,
): Values;
```

```svelte
<!-- src/features/settings/BackupButtons.svelte -->
<script lang="ts">
  interface Props {
    values: Values;
    onRestore: (values: Values) => Promise<void>;
    filename?: string; // 既定は BACKUP_FILENAME
    scope?: BackupScope; // 省くと、すべての設定を出し入れする
    noun?: string; // 結果の文言で、読み込んだものを指す名前。既定は「設定」
  }
</script>
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
    onOpen?: () => void; // 別の画面で開く種類の行が押された時
  }
</script>
```

`FieldRow` は `unknown` だけを扱う。型が閉じているのは `defineGroup` の中だけで、描画側は値の型を知らない。

集約する側:

```ts
// src/features/settings/fields.ts
// 全機能の入り切り。タブの中ではなく、画面の最上部に置く
export const extensionGroup = defineGroup("general", "有効", extensionSetting, {
  enabled: { label: "有効", control: { kind: "toggle" } },
});

export const settingsGroups: readonly SettingsGroup[] = [
  defineGroup("home", "非表示にする項目", homeHideElementsSetting, {
    announcements: { label: "お知らせ", control: { kind: "toggle" } },
    categories: { label: "コースカテゴリ", control: { kind: "toggle" } },
    search: { label: "コース検索", control: { kind: "toggle" } },
  }),
  // title が同じで隣り合うグループは、1枚のカードにまとまる
  defineGroup("course", "コースページ", coursePageReverseSectionsSetting, {
    enabled: {
      label: "セクション（授業回）を逆順に並べる",
      control: { kind: "toggle" },
    },
  }),
  defineGroup("course", "コースページ", coursePageGradeInlineSetting, {
    enabled: { label: "課題の横に得点を表示する", control: { kind: "toggle" } },
  }),
];
```

`settingsGroups` は全グループの一部を例として載せている。並びと文言の全体は `fields.ts` が持つ。

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
2. `read` は `setting.fallback` の上へ `setting.getValue()` の結果を重ねて返す。重ねるのは最上位のキーだけ。**ここにもキャストが要る**
3. `write(key, value)` は `setting.getValue()` で現在値を読み、`key` だけを差し替えた値を `setting.setValue()` で書く。ここはキャスト不要
4. `replace(value)` は、渡された値でグループ全体を `setting.setValue()` へ書く。バックアップの読み込みが使う
5. `options` の `footer` と `after` は、そのまま `SettingsGroup` へ載せる

型を落とす2箇所は次のように書く。

```ts
const erasedFields = fields as Record<string, FieldMeta>;
const read = async () =>
  ({
    ...setting.fallback,
    ...(await setting.getValue()),
  }) as Record<string, unknown>;
```

キャストが避けられない理由は下の決めごとに書く。

### SettingsPanel

1. `extensionGroup` と `settingsGroups` の全グループの `read()` を `Promise.all` で呼び、`id` をキーとして値を保持する。待つ間は「設定を読み込み中...」を出す
2. 読み込みに失敗した場合は、メッセージと「再試行」ボタンを `role="alert"` の中に出す。ボタンは手順1をやり直す
3. `CATEGORY_LABELS` のキー順にタブを作る（ホーム・コース・全体）
4. 各タブへ、そのカテゴリに属するグループを `fields.ts` に並べた順で置く。置き方は下の「カードの区切り」に従う
5. 「全体」タブの末尾へ、見出し「バックアップ」のカードを置き、`BackupButtons` を入れる
6. `FieldRow` から変更が届いたら、下の「保存」に従って書き込む
7. `FieldRow` から `onOpen` が届いたら、下の「別の画面」に従ってその行を開く

#### カードの区切り

グループの項目を、`fields` に書いた順で行にする。行はそれぞれ見出しを1つ持つ。見出しは項目の `section`、省いた場合はグループの `title`。

**見出しが同じで隣り合う行を、1枚のカード（角丸の白い面）へまとめる。** カードの上へ見出しを出す。項目はカードの中へ1行ずつ並べ、行の間を線で区切る。線は左端だけを行の文字の位置へ揃え、右端はカードの端まで引く。

この規則1つから、次の置き方がすべて出る。

| やりたいこと | 書き方 |
|---|---|
| 複数のグループを1枚のカードへまとめる | グループの `title` を同じにして隣り合わせに並べる（「コースページ」の3グループ） |
| 1つのグループを2枚のカードへ分ける | 分けたい行の `section` へ別の見出しを書く（`menuBadgesSetting` の「時計」と「カウントダウン」） |
| 別のグループの行を、カードの途中へ入れる | 入れる側のグループの `after` へ、直前に来る行の id（`rowId(groupId, key)`）を書き、行の `section` を入れ先の見出しに揃える（時限表を、時間割の入り切りの直後へ入れる） |

`after` を持つグループは、自分の位置には置かず、指した行の直後にだけ置く。保存先は元のグループのまま変わらない。

グループの `footer` は、そのグループの最後の行と同じカードの末尾へ置く。`values`（全グループの今の値）と `onRestore`（下の「バックアップ」の読み込みの手順4）を渡す。

グループが `enabled` という名前のトグルを持つ場合、それを機能全体の入り切りとして扱う。

1. `enabled` の行は、他の項目と同じ形でカードの中に描く。`fields.ts` で先頭に書く
2. `enabled` が false の間は、`enabled` の行だけを描く。残りの項目と `footer` は描かない
3. `after` で差し込まれた別のグループの行は、差し込み先のグループの `enabled` に従わない。差し込む側のグループの `enabled` にだけ従う

#### 全体のスイッチ

`extensionGroup` の `enabled` を、タブの上の「有効」スイッチとして描く。保存は他の項目と同じ手順を使う。

false の間も、タブとカードは操作できるまま残し、タブの中身を半透明（`opacity-50`）にする。機能を止めるのは content script の側で、設定画面は値の編集を止めない。

#### 別の画面

`nested` と `custom` の行は、押すとその項目だけを出す画面へ進む。

1. 今のスクロール位置を控え、開く行と、そこまでの道筋（タブの名前・カードの見出し・項目の `label`）を持つ
2. タブの中身の代わりに、その項目の中身を1枚のカードで描く。`nested` は子の項目を `FieldRow` の行として並べ、`custom` は `meta.control.component` を `value` と `onChange` を渡して描く
3. ヘッダの「有効」スイッチとタブの代わりに、「戻る」ボタンと道筋（パンくず）を出す。道筋の最後の要素が今いる場所で、`aria-current="page"` を付ける
4. 「戻る」が押されたら一覧へ戻し、控えたスクロール位置へ戻す

`nested` の子の変更は、親のオブジェクトへ畳み込んでから `group.write(key, value)` へ渡す（`{ ...value, [k]: sub }`）。最上位のキーの値が丸ごと届くため、保存の手順は他の項目と変わらない。

#### バックアップ

書き出し:

1. `buildBackup(values)` へ、いま保持している全グループの値を渡す。`{ app: "mi-mo", version: 1, settings }` の形になる
2. JSON の文字列にし、`saveBlob` で `BACKUP_FILENAME` として保存する

読み込み:

1. 選ばれたファイルの文字列を `parseBackup(text, current)` へ渡す
2. `parseBackup` は、`app` が `"mi-mo"` でないファイルと、JSON として読めないファイルに例外を投げる
3. 今あるグループとキーのうち、ファイルに値があり、種類（`typeof` と、配列かどうか）が今の値と合うものだけを取り込む。それ以外のキーは今の値を残す。ファイルに無いグループは返さない
4. `SettingsPanel` は、進行中の保存（`saveQueue`）を待ってから、返ったグループごとに `group.replace(value)` を呼び、全グループを読み直す。読み直す間も一覧は描いたまま残す
5. 結果を「設定を読み込みました」「このファイルは読み込めません」のどちらかで、`role="status"` の中に出す。「設定」の部分は `noun` で差し替わる

`scope` を渡した場合は、範囲のグループとキーだけを出し入れする。時間割のファイル（[`./timetableFields.md`](./timetableFields.md)）が使う。

- 書き出し: `narrowValues(values, scope)` の結果を `buildBackup` へ渡し、`filename` で保存する
- 読み込み: `parseScopedBackup(text, current, scope)` を使う。`narrowValues(current, scope)` を今の値として `parseBackup` を呼び、返ったグループを今のグループの値へ重ねる。ファイルに範囲のグループが無い場合は例外を投げる

#### 保存

1. 変更前の値を控え、手元の値を先に新しい値へ更新する
2. 書き込みを1本の `Promise` の鎖（`saveQueue`）の末尾へ足す。前の書き込みが終わってから `group.write(key, value)` を呼ぶ
3. 書き込みが失敗した場合、`console.error("[mi-mo] settings", error)` を出し、手元の値を控えた値へ戻す。ヘッダの中に「「`<label>`」を保存できませんでした。もう一度操作してください。」を `role="alert"` で出す
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
| `nested`、`custom` | 行全体を1つのボタンにする。左に `label` と `description`、右に値が配列の場合の件数（「6件」）と右向きの山形を出す。押されたら `onOpen` を呼ぶ。中身は描かない |

`nested` と `custom` の中身は、`SettingsPanel` が別の画面に描く。

### 画面の骨組み

上から、「有効」スイッチと1行の注記（「変更を適用するにはページを再読み込みしてください」）、タブ、選んだタブの中身の順に置く。別の画面を開いている間は、スイッチとタブの代わりに「戻る」ボタンとパンくず（`aria-label="現在の場所"`）を置く。保存の失敗もヘッダの中に出す。

スクロールはパネルのルート要素が持つ（`h-dvh overflow-x-hidden overflow-y-auto`）。ヘッダは `sticky top-0` でその上端に残し、スクロールしてもタブを押せるようにする。タブを切り替えた時と別の画面を開いた時は、スクロール位置を先頭へ戻す。別の画面から戻った時は、開く前の位置へ戻す。

背景は `bg-muted`、カードは `bg-card` にし、面の明るさの差でまとまりを見せる。カードに枠線と影は付けない。ダークでは背景を `bg-background` にする。

中身の幅は `max-w-2xl`（672px）の中央寄せにする。項目は幅にかかわらず1列に並べる。

ポップアップは `src/entrypoints/popup/index.html` の `html` と `body` へ当てるスタイルで、幅 380px・高さ 560px・`overflow: hidden` に固定する。ポップアップは中身に合わせて伸び縮みするため、固定しないとタブを切り替えるたびに大きさが変わる。専用エディタは 380px の幅に収まる形で作る。

### 文字の大きさと強弱

| 役割 | クラス | 大きさ |
|---|---|---|
| カードの見出し、「有効」 | `text-row font-semibold` | 15px |
| 項目の `label`、入力した値 | `text-row` | 15px |
| `description`、件数、単位、注記、パンくず | `text-note text-muted-foreground` | 13px |

`text-row` と `text-note` は `src/assets/global.css` の `@theme` に置く。設定画面では 13px より小さい文字を使わない。太字はカードの見出し、「有効」、パンくずの現在地にだけ使い、行の中では色の濃淡だけで主従を付ける。

### 動き

| 対象 | 動き |
|---|---|
| タブの選択中の印 | 1枚の面を `translateX` で滑らせる（`transition-transform duration-200`） |
| タブの中身 | 切り替えた時に `fade-in` |
| 行の出入り（入り切りで詳細が現れる・消える） | Svelte の `slide`（150ms） |
| 別の画面 | 右から入る（`slide-in-from-right-4`） |
| 別の画面から戻った一覧 | 戻った直後だけ左から入る（`slide-in-from-left-4`）。タブを切り替えた時点で外す |
| 全体のスイッチが false | タブの中身を `opacity-50` へ `transition-opacity` で移す |

CSS の動きには `motion-reduce:` の指定を添え、OS が動きを減らす設定の間は止める。

### 行の形

行の高さは 48px 以上にする（`min-h-12 py-3`）。`text` 以外の項目は、左に `label` と `description`、右にコントロールを置く1行にする（`flex items-center justify-between gap-4`）。`text` だけは入力欄が長いため、`label` の下へ全幅で置く。

## 項目を足す時の規約

`fields.ts` へ項目を足す時は、次に従う。画面の密度と優先度を保つための規約で、型では縛れない。

- **機能全体を入り切りするトグルのキーは `enabled` にし、グループの先頭に書く。** 無効の間は、この行だけが残って詳細が畳まれる。別の名前にすると、無効な機能の詳細が並び続ける
- **入り切りしかない機能は、同じ画面に効くもの同士で `title` を揃え、隣り合わせに並べる。** 1枚のカードへまとまり、1行だけのカードが縦に並ぶのを避けられる。見出しは画面の名前になるため、`label` だけで何が起きるかを言い切る
- **`label` は 18字前後に収める。** 右にコントロールが載るため、長いと折り返す。補足は `description` へ回す。カードの見出しが対象を示している場合は、名詞だけにする（「非表示にする項目」の下の「お知らせ」）
- **`description` は、ラベルだけでは結果が想像できない項目にだけ書く。** すべての項目へ書くと、読むべき説明が埋もれる
- **一覧や表を編集する項目は `custom` にする。** 一覧には件数だけが見え、中身は押した人だけが別の画面で読む
- **1つのグループの項目は7つ前後までにする。** 超える場合は、`nested` でまとめるか、グループを分ける
- **よく変える項目を上、一度決めたら触らない項目を下に置く。** `fields.ts` に並べた順がそのまま表示順になる。タブの中のグループの順も同じ規則で決める
- **選択肢が2つで「する・しない」と読める場合は `toggle`、それ以外は `select` にする。** ラジオボタンは使わない

## 決めごと

- **表示メタは `fields.ts` が1箇所で持ち、`src/features/` の各機能は設定の型だけを持つ。** 機能側が UI の文言を持つと、ラベルの統一と並び順の調整が機能ごとに散らばる
- **`FieldsOf<C>` で全キー分の `FieldMeta` を要求する。** 機能側の Config にキーを足すと `fields.ts` がコンパイルエラーになり、書き忘れが型で止まる
- **`defineGroup` の戻り値は型引数を落とした `SettingsGroup` にする。** 型の違うグループを1つの配列へ並べるため。読み書きは `defineGroup` の中で型が閉じており、描画側は `unknown` だけを見る
- **型を落とす2箇所はキャストで書く。安全性を手放す境界がここだと決める。** `FieldsOf<C>` から `Record<string, FieldMeta>` への代入は、`kind: "custom"` の `Component<CustomFieldProps<V>>` が `V` について不変（`value` と `onChange` の両方で `V` を使うため）で、`Component` 自体も Props に対して反変になるため、キャスト無しでは通らない。`setting.getValue()` の `Promise<C>` も、`C extends object` の制約だけでは `Promise<Record<string, unknown>>` へ代入できない。どちらも `tsc --strict` で確認済み
- **`read` は既定値の上へ保存済みの値を重ねる。** `fallback` は何も保存されていない時にだけ効く。項目を後から足した設定では、保存済みの値に新しいキーが無く、そのままでは `select` が何も選ばれていない状態で出る。重ねておくと、バックアップの読み込みも新しいキーを取り込める
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
- **`footer` へ、全グループの値と取り込みの手段を渡す。** ファイルの出し入れのように、複数のキーをまとめて書き換える操作を `footer` に置けるようにする。取り込みを `SettingsPanel` の1箇所へ通すことで、保存の順番待ちと読み直しを `footer` ごとに書かずに済む
- **一部だけの出し入れも、バックアップと同じ形式のファイルにする。** 範囲は読む側と書く側が絞る。形式が1つなので、バックアップと時間割のファイルを相互に読める
- **取り込みの後の読み直しでは、一覧を「読み込み中」へ戻さない。** 戻すと一覧が描き直され、`BackupButtons` が持つ結果の文言が消える
- **`select` はネイティブの `<select>` で描く。** shadcn の Select は選択肢を別の層へ描くため、高さの限られたポップアップでは切れる場合がある。ネイティブの部品は OS が描くため切れず、キーボード操作も OS の標準に従う
- **保存を直列にする。** `write` は読む・差し替える・書くの3手で、同じグループの2項目を続けて変えると、並行した書き込みの後勝ちで先の変更が消える
- **失敗した保存は手元の値を巻き戻す。** 画面が保存されていない値を出し続けると、利用者は保存されたと受け取る
- **無効な機能の詳細を描かない。** 効かない項目を並べると、読む量だけが増える。有効にした時点で現れるため、探す手間は増えない
- **カードの区切りを、見出しの一致という1つの規則で決める。** グループは保存先の単位、カードは見た目の単位で、両者は一致しない場合がある（時限表は時計も使うため別の保存先を持ち、画面では時間割のカードに入る）。`title`・`section`・`after` の3つで、保存先を変えずに見た目だけを組み替える
- **一覧や表の中身は、その場で開かず別の画面に出す。** 380px の幅で一覧の途中に編集欄を広げると、前後の行が画面の外へ押し出され、今どこにいるかを見失う。別の画面では、パンくずが場所を示し、編集欄が幅をすべて使える
- **スクロールはパネル自身が持つ。** ポップアップとオプション画面ではスクロールする要素が違う。パネルが持つと、スクロール位置の控えと復帰を1つの要素に対して書ける
- **全体のスイッチは、設定を残したまま全機能を止めるために持つ。** Moodle の表示が崩れた時に、原因が拡張機能かどうかを切り分けられる。拡張機能そのものを無効にすると設定画面も開けなくなる
- **全体のスイッチはタブの中ではなく最上部に置く。** どのタブの機能にも効くため、タブに属させない
- **全体のスイッチが false の間も、設定の編集は止めない。** 止めている間に設定を直してから戻す、という使い方を残す。半透明にして、効いていないことだけを見せる
- **バックアップを持つ。** 拡張機能の入れ直しや別のブラウザへの移行で、時間割や時限表を打ち直さずに済む
- **バックアップの読み込みは、今あるグループとキーで、値の種類が合うものだけを取り込む。** 古い版や手で書き換えたファイルを読んでも、知らないキーや形の違う値が保存先へ入らない
- **バックアップのカードはグループの外に置く。** 保存項目を持たない操作で、`fields` のキーに対応しない
- **設定の検索とプロファイルの切り替えは作らない。** 3つのタブに収まる量で、探す手段を足すほどの項目数が無い
- **画面自体の設定（テーマの手動切り替えなど）は持たない。** 仕様書が「この画面自体の設定はない」と定めている
