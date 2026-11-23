# settings panel モジュール

## 概要

拡張機能のすべての設定を1枚の画面で編集する。ツールバーのポップアップと、ブラウザの拡張機能管理から開く設定ページの両方が、同じ画面をそのまま表示する。項目のラベルや UI の種類といった表示上の情報は、このモジュールが1箇所へ集める。

## 関連

- 使う: [`../utils/settings.md`](../utils/settings.md) — 編集対象のストレージ項目。ここが export する `<機能><設定名>Setting` を読み書きする
- 使う: [`../utils/theme.md`](../utils/theme.md) — OS のカラースキームに合わせた `dark` クラスの付け外し
- 使う: [`./menuFields.md`](./menuFields.md) — 時限表・カウントダウン・メニュー項目の専用エディタ
- 使う: [`./timetableFields.md`](./timetableFields.md) — 時間割の専用エディタと、`footer` に置くファイルの出し入れと `.ics` の書き出しボタン
- 使う: [`../utils/download.md`](../utils/download.md) — バックアップのファイルを保存する `saveBlob`
- 使う: [`./controls.md`](./controls.md) — `date` の `DatePicker`、読み込みとリセットの前の `ConfirmDialog`、操作の行の `ActionRow`、別の画面へ進む行の `OpenRow`、見出しつきのカードの `SectionCard`、結果の文言の `StatusText`
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
| `src/features/settings/BackupButtons.svelte` | バックアップの書き出しと読み込みのボタン。読み込みの前に上書きを尋ねる |
| `src/features/settings/reset.ts` | リセットの操作の一覧と、既定値へ戻す処理 |
| `src/features/settings/ResetRows.svelte` | リセットの行を1枚のカードへ並べ、確認を挟んで実行する |
| `src/features/settings/filePicker.ts` | 読み込むファイルを選ばせる。Firefox のポップアップではオプション画面へ移し、移った先で読み込みのボタンを示す |
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
  | {
      kind: "custom";
      component: Component<CustomFieldProps<V>>;
      prune?: (value: V) => V; // 別の画面を閉じる時に値を整える
      fill?: boolean; // 別の画面の残りの高さに収め、はみ出す分は部品の中でスクロールさせる
    };

export interface FieldMeta<V = unknown, C = unknown> {
  label: string;
  description?: string;
  section?: string; // この行を置くカードの見出し。省くとグループの title になる
  control: FieldControl<V>;
  // グループの今の値を受け取り、false の間は行を出さない。省くと常に出す
  when?(config: C): boolean;
}

export type FieldsOf<C> = { [K in keyof C]-?: FieldMeta<C[K], C> };

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

// 全グループの今の値。グループの id → そのグループの値
export type SettingsValues = Record<string, Record<string, unknown>>;

// footer が受け取る、全グループの今の値と、値を取り込む手段
export interface FooterProps {
  values: SettingsValues;
  onRestore: (values: SettingsValues) => Promise<void>;
}

export interface GroupOptions<C = Record<string, unknown>> {
  footer?: Component<FooterProps>;
  after?: string;
  // replace で書く前に値を整える。古いバックアップの値を今の形へ直すのに使う
  normalize?: (value: C) => C;
}

// 行の id。`<グループの id>.<キー>` の形になる
export function rowId(groupId: string, key: string): string;

// 設定のキーごとのロックの中で task を走らせる。画面をまたいで書き込みを順に並べる
export function withSettingLock(key: string, task: () => Promise<void>): Promise<void>;

// 保存済みの値へ patch のキーだけを重ねて書く。読んでから書くまでを withSettingLock で囲む
export function patchSetting<C>(setting: WxtStorageItem<C, any>, patch: Partial<C>): Promise<void>;

export function defineGroup<C extends object>(
  category: SettingsCategory,
  title: string,
  setting: WxtStorageItem<C, Record<string, unknown>>,
  fields: FieldsOf<C>,
  options?: GroupOptions<C>,
): SettingsGroup;

export const CATEGORY_LABELS: Record<SettingsCategory, string>;
```

全体のスイッチ:

```ts
// src/utils/settings.ts
export interface ExtensionConfig {
  enabled: boolean; // false の間は、設定を残したまま全機能を止める
}

export const extensionSetting = defineSetting<ExtensionConfig>(
  "local:extension",
  { fallback: { enabled: true } },
);
```

```ts
// src/entrypoints/shared.content.ts と early.content.ts の main()。
// extension は他の設定と一緒に Promise.all で読んだ値
if (!extension.enabled) {
  return;
}
```

バックアップ:

```ts
// src/features/settings/backup.logic.ts
// 値の形は types.ts の SettingsValues を使う

export const BACKUP_FILENAME = "mi-mo-settings.json";

export interface BackupFile {
  app: "mi-mo";
  version: number;
  settings: SettingsValues;
}

export function buildBackup(values: SettingsValues): BackupFile;

// current は今の値。ファイルにあるグループだけを、取り込んだ後の値にして返す
export function parseBackup(text: string, current: SettingsValues): SettingsValues;

// 出し入れする範囲。グループの保存キーと、そのグループの中で対象にするキーの組。複数のグループを持てる
export type BackupScope = Readonly<Record<string, readonly string[]>>;

// 範囲に入るグループとキーだけを残して返す
export function narrowValues(values: SettingsValues, scope: BackupScope): SettingsValues;

// 範囲に入る値だけを取り込み、範囲の外のキーは今の値を残して、グループ全体の値を返す
export function parseScopedBackup(
  text: string,
  current: SettingsValues,
  scope: BackupScope,
): SettingsValues;
```

```svelte
<!-- src/features/settings/BackupButtons.svelte -->
<script lang="ts">
  interface Props {
    values: SettingsValues;
    onRestore: (values: SettingsValues) => Promise<void>;
    filename?: string; // 既定は BACKUP_FILENAME
    scope?: BackupScope; // 省くと、すべての設定を出し入れする
    noun?: string; // 結果の文言で、読み込んだものを指す名前。既定は「設定」
  }
</script>
```

リセット:

```ts
// src/features/settings/reset.ts
// 戻す対象。keys を省くと項目の全体を、あればそのキーだけを既定値へ戻す
interface ResetTarget {
  item: WxtStorageItem<any, any>;
  keys?: readonly string[];
}

export interface ResetAction {
  label: string; // 「〜をリセット」の形にする
  broad?: boolean; // 範囲の大きい操作。行を赤にする
  targets: readonly ResetTarget[] | "all"; // "all" は保存領域を丸ごと空にする
}

// 押すと別の画面へ進み、中の操作を並べる
export interface ResetMenu {
  id: string; // 開いている場所を hash へ写す時の名前
  label: string;
  actions: readonly ResetAction[];
}

export type ResetEntry = ResetAction | ResetMenu;

export const resetEntries: readonly ResetEntry[]; // 「リセット」のカードに並べる順
export const resetEverything: ResetAction; // 「すべての設定をリセット」。別のカードに置く
export const resetMenus: readonly ResetMenu[]; // resetEntries のうちの ResetMenu

export function runReset(action: ResetAction): Promise<void>;
```

```svelte
<!-- src/features/settings/ResetRows.svelte -->
<script lang="ts">
  interface Props {
    title?: string; // カードの見出し。省くと見出しを出さない
    entries: readonly ResetEntry[];
    onOpen?: (menu: ResetMenu) => void; // ResetMenu の行が押された時
    onReset: (action: ResetAction) => Promise<void>; // 確認で「リセット」が押された時
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
pnpm dlx shadcn-svelte@latest add tabs switch input label button select popover calendar alert-dialog accordion input-group
```

`src/lib/components/ui/` は CLI が生成する。手で書かない。ただし `button` は、`alert-dialog` と `input-group` が使う大きさ（`xs`・`icon-xs`・`icon-sm`・`icon-lg`）を足した。CLI で `button` を上書きすると既存の見た目が変わるため、この4つだけを手で足している。`calendar` は、見出しを年と月のドロップダウンにする `captionLayout` を外し、`calendar-month-select.svelte` と `calendar-year-select.svelte` を消した。理由は [`../../release.md`](../../release.md) の決めごとにある。CLI で `calendar` を入れ直す場合は、もう一度外す。

開閉の動きの長さと、動きを減らす設定での停止は、部品のファイルではなく `src/assets/global.css` が `data-slot` を指して決める。部品を CLI で作り直しても消えない。

### defineGroup

グループの `id` は WXT の保存項目が持つ `setting.key` から取得する。表示文言を変えても識別は変わらず、別の ID 定義を増やさない。保存先のキーやデータ形式の変更は伴わない。

1. 渡された `fields` を `Record<string, FieldMeta>` として保持する。ここで型引数 `C` を落とす。**代入にはキャストが要る**
2. `read` は `setting.getValue()` の結果をそのまま返す。欠けたキーは `defineSetting`（[`../utils/settings.md`](../utils/settings.md)）の `getValue` が入れ子まで既定値で補う。**ここにもキャストが要る**
3. `write(key, value)` は `patchSetting(setting, { [key]: value })` を呼ぶ。`patchSetting` は `withSettingLock(setting.key, ...)`（中で `navigator.locks.request("mi-mo-settings:<設定のキー>", ...)` を呼ぶ）の中で現在値を読み、`patch` のキーだけを重ねて `setting.setValue()` で書く
4. `replace(value)` は、渡された値を `options.normalize` で整えてから、グループ全体を `setting.setValue()` へ書く。`write` と同じロックの中で書く。`normalize` を省くと値をそのまま書く。バックアップと時間割のファイルの読み込みが使う
5. `options` の `footer` と `after` は、そのまま `SettingsGroup` へ載せる

時間割のグループは `normalize` に `normalizePeriods`（[`../utils/periods.md`](../utils/periods.md)）を渡し、古いファイルの時限表を読んでも番号が振り直されるようにする。

型を落とす2箇所は次のように書く。

```ts
const erasedFields = fields as Record<string, FieldMeta>;
const read = async () => (await setting.getValue()) as Record<string, unknown>;
```

キャストが避けられない理由は下の決めごとに書く。

### SettingsPanel

1. `extensionGroup` と `settingsGroups` の全グループの `read()` を `Promise.all` で呼び、`id` をキーとして値を保持する。待つ間は「設定を読み込み中...」を出す
2. 読み込みに失敗した場合は、メッセージと「再試行」ボタンを `role="alert"` の中に出す。ボタンは手順1をやり直す
3. `CATEGORY_LABELS` のキー順にタブを作る（ホーム・コース・全体）
4. 各タブへ、そのカテゴリに属するグループを `fields.ts` に並べた順で置く。置き方は下の「カードの区切り」に従う
5. 「全体」タブの末尾へ、見出し「バックアップ」のカードを置き、`BackupButtons` を入れる。その下へ `ResetRows`（`title="リセット"`、`resetEntries`）のカードを置き、さらにその下へ見出しの無い `ResetRows`（`resetEverything` だけ）のカードを置く
6. `FieldRow` から変更が届いたら、下の「保存」に従って書き込む
7. `FieldRow` から `onOpen` が届いたら、下の「別の画面」に従ってその行を開く。`ResetRows` から `onOpen` が届いた場合も同じ

#### カードの区切り

グループの項目を、`fields` に書いた順で行にする。行はそれぞれ見出しを1つ持つ。見出しは項目の `section`、省いた場合はグループの `title`。

**見出しが同じで隣り合う行を、1枚のカード（角丸の白い面）へまとめる。** カードの上へ見出しを出す。カードと見出しは `SectionCard`（[`./controls.md`](./controls.md)）で描く。隣り合う項目を見出しでまとめる処理は、`nested` の子の枠分けと同じ関数を使う。項目はカードの中へ1行ずつ並べ、行の間を線で区切る。線は左端だけを行の文字の位置へ揃え、右端はカードの端まで引く。

この規則1つから、次の置き方がすべて出る。

| やりたいこと | 書き方 |
|---|---|
| 複数のグループを1枚のカードへまとめる | グループの `title` を同じにして隣り合わせに並べる（「コースページ」の3グループ） |
| 1つのグループを2枚のカードへ分ける | 分けたい行の `section` へ別の見出しを書く（`menuBadgesSetting` の「時計」と「カウントダウン」） |
| 別のグループの行を、カードの途中へ入れる | 入れる側のグループの `after` へ、直前に来る行の id（`rowId(groupId, key)`）を書き、行の `section` を入れ先の見出しに揃える（時限表を、時間割の入り切りの直後へ入れる） |

`after` を持つグループは、自分の位置には置かず、指した行の直後にだけ置く。保存先は元のグループのまま変わらない。

グループの `footer` は、そのグループの最後の行と同じカードの末尾へ置く。`values`（全グループの今の値）と `onRestore`（下の「バックアップ」の読み込みの手順6）を渡す。

グループが `enabled` という名前のトグルを持つ場合、それを機能全体の入り切りとして扱う。

1. `enabled` の行は、他の項目と同じ形でカードの中に描く。`fields.ts` で先頭に書く
2. `enabled` が false の間は、`enabled` の行だけを描く。残りの項目と `footer` は描かない
3. `after` で差し込まれた別のグループの行は、差し込み先のグループの `enabled` に従わない。差し込む側のグループの `enabled` にだけ従う

#### 条件つきの行

`when` を持つ行は、そのグループの今の値を `when` へ渡し、false の間は描かない。`enabled` が false で畳まれている間は、`when` を見る前に畳む。時間割の「カウントダウンを時間割に合わせる」は、時間割に授業がある間だけ出す（[`./timetableFields.md`](./timetableFields.md)）。

#### 全体のスイッチ

`extensionGroup` の `enabled` を、タブの上の「有効」スイッチとして描く。保存は他の項目と同じ手順を使う。

false の間も、タブとカードは操作できるまま残し、タブの中身を半透明（`opacity-50`）にする。機能を止めるのは content script の側で、設定画面は値の編集を止めない。

別の画面を開いた時と閉じた時は、140ms の間スイッチを `disabled` にする。「戻る」はスイッチと同じ位置にあり、連打した2回目が、戻った先のスイッチに当たるのを防ぐ。OS が動きを減らす設定の間（`MediaQuery("prefers-reduced-motion: reduce")`）は、画面がすぐ入れ替わるため止めない。タイマーは画面を破棄する時に消す。

#### 別の画面

`nested` と `custom` の行は、押すとその項目だけを出す画面へ進む。リセットの `ResetMenu` の行も同じ仕組みで進み、中身に `ResetRows`（`menu.actions`）を描く。道筋は「全体」「リセット」`menu.label` になる。

1. 今のスクロール位置を控え、開く行と、そこまでの道筋（タブの名前・カードの見出し・項目の `label`）を持つ
2. タブの中身の代わりに、その項目の中身を描く。`nested` は子の項目を `FieldRow` の行として並べ、`custom` は `meta.control.component` を `value` と `onChange` を渡して1枚のカードで描く
3. ヘッダの「有効」スイッチとタブの代わりに、「戻る」ボタンと道筋（パンくず）を出す。道筋の最後の要素が今いる場所で、`aria-current="page"` を付ける
4. 「戻る」が押されたら、`custom` が `prune` を持つ場合は今の値を `prune` へ通し、値が変わった時だけ下の「保存」の手順で書く。そのあと一覧へ戻し、控えたスクロール位置へ戻す

`nested` の子は、子の `section` が変わる所でカードを分ける。続く子の `section` が同じなら1枚のカードに入れる。`section` を省いた子のカードは見出しを出さず、カードの間の隙間だけで区切る。

`custom` が `fill` を持つ場合は、別の画面を残りの高さ（`h-full`）に収める。部品は渡された高さまで伸び、はみ出す分を部品の中でスクロールさせる。画面全体はスクロールしない。

`nested` の子の変更は、親のオブジェクトへ畳み込んでから `group.write(key, value)` へ渡す（`{ ...value, [k]: sub }`）。最上位のキーの値が丸ごと届くため、保存の手順は他の項目と変わらない。

#### バックアップ

書き出し:

1. `buildBackup(values)` へ、いま保持している全グループの値を渡す。`{ app: "mi-mo", version: 1, settings }` の形になる
2. JSON の文字列にし、`saveBlob` で `BACKUP_FILENAME` として保存する

読み込み:

1. 「ファイルから読み込む」が押されたら `openFilePicker(input)` を呼ぶ。Firefox のポップアップの中（`import.meta.env.FIREFOX` で、`location.pathname` が `/popup.html` で終わる）では、`browser.tabs.create` で `options.html?pick#<今の hash>` をタブで開き、`window.close()` でポップアップを閉じる。それ以外では `input.click()` でファイル選択を開く。挨拶のメッセージの読み込みも同じ関数を使う。移った先では、読み込みのボタンに付けた `pickTarget(showHint)` が、`pick` の印があり、ボタンが見えている時に一度だけ、ボタンを画面の中ほどへ出し、`focus({ focusVisible: true })` で輪を出し、`showHint` で「ここからファイルを選んでください」を出す。ファイル選択はクリックの直後にしか開けないため、自動では開かない
2. 選ばれたファイルの文字列を `parseBackup(text, current)` へ渡す
3. `parseBackup` は、`app` が `"mi-mo"` でないファイルと、JSON として読めないファイルに例外を投げる
4. 今あるグループとキーのうち、ファイルに値があり、種類（`typeof` と、配列かどうか）が今の値と合うものだけを取り込む。それ以外のキーは今の値を残す。ファイルに無いグループは返さない
5. 読めた場合だけ、`ConfirmDialog`（[`./controls.md`](./controls.md)）で「現在の設定が上書きされます。よろしいですか？」と尋ねる。ボタンは「キャンセル」と「読み込む」。読めなかった場合は尋ねずに手順7の失敗の文言を出す
6. 「読み込む」が押された時だけ `onRestore` を呼ぶ。`SettingsPanel` は、受け取った値を `$state.snapshot` で素の値へ直し（読み込んだ値は今の値と混ぜて組まれ Proxy を含むため。Firefox ではそのまま渡すと `DataCloneError` で失敗する）、進行中の保存（`saveQueue`）を待ってから、返ったグループごとに `group.replace(value)` を呼び、全グループを読み直す。読み直す間も一覧は描いたまま残す
7. 結果を `StatusText`（`role="status"`）で出す。成功は「設定を読み込みました」、ファイルが読めない場合は「このファイルは読み込めません」、`onRestore` が失敗した場合は「設定を保存できませんでした」。「設定」の部分は `noun` で差し替わる

`scope` を渡した場合は、範囲のグループとキーだけを出し入れする。範囲は複数のグループにまたがってよい。時間割のファイル（[`./timetableFields.md`](./timetableFields.md)）が使う。

- 書き出し: `narrowValues(values, scope)` の結果を `buildBackup` へ渡し、`filename` で保存する
- 読み込み: `parseScopedBackup(text, current, scope)` を使う。`narrowValues(current, scope)` を今の値として `parseBackup` を呼び、返ったグループを今のグループの値へ重ねる。ファイルに範囲のグループが1つも無い場合は例外を投げる。一部のグループだけがある場合は、あるグループだけを返し、無いグループは今の値を残す

バックアップのカードの中では、書き出しと読み込みを `ActionRow`（[`./controls.md`](./controls.md)）の行で並べる。どちらも青で、今のアイコン（`Download`・`Upload`）を左に付ける。読み込みの確認は `destructive` にする。

#### リセット

1. `ResetRows` は `entries` を `SectionCard` の1枚のカードへ並べる。`title` を渡すとカードの上へ見出しを出す。`ResetMenu` は `OpenRow`、`ResetAction` は `ActionRow` で描く。`broad` の行だけを赤（`danger`）にし、アイコンは付けない
2. `ResetAction` の行が押されたら、`ConfirmDialog` を `destructive` で開く。文は「`<label>`します。元に戻せません。よろしいですか？」、続けるボタンは「リセット」
3. 「リセット」が押された時だけ `onReset(action)` を呼ぶ。`SettingsPanel` は、進行中の保存（`saveQueue`）の末尾へ `runReset(action)` を足して待ち、全グループを読み直す
4. `runReset` は、`targets` が `"all"` なら `storage.clear("local")` で保存領域を丸ごと空にする。それ以外は対象ごとに、`keys` が無ければ `withSettingLock(item.key, ...)` の中で `item.removeValue()` を呼び、あれば `item.fallback` のそのキーだけを `patchSetting` で今の値へ重ねて書く。対象どうしは `Promise.all` で並べる
5. 結果をカードの末尾の `StatusText`（`role="status"`）に出す。成功は「`<label>`しました」、失敗は `console.error("[mi-mo] settings", error)` を出して「`<label>`できませんでした」

| 行 | 戻すもの |
|---|---|
| 時間割 › 時限をリセット | `periodTableSetting` の全体 |
| 時間割 › 授業科目をリセット | `timetableSetting` の `grid` |
| 時間割 › 休講日をリセット | `timetableSetting` の `holidays` |
| 時間割 › 振替日をリセット | `timetableSetting` の `substitutes` |
| 時間割 › 時間割をすべてリセット（赤） | `timetableSetting` と `periodTableSetting` の全体 |
| 挨拶 › 自分の一言をリセット | `homeGreetingSetting` の `messages` |
| 挨拶 › 挨拶をすべてリセット（赤） | `homeGreetingSetting` と `homeGreetingLastMessage` の全体 |
| ホームで非表示にする項目をリセット | `homeHideElementsSetting` の全体 |
| コース設定をすべてリセット（赤） | 「コース」タブの全項目（`myCoursesTodayOrderSetting` と `coursePage*Setting`） |
| 上部メニュー › 隠す項目をリセット | `menuSetting` の `hidden` |
| 上部メニュー › 追加する項目をリセット | `menuSetting` の `items` |
| 上部メニュー › 上部メニューをすべてリセット（赤） | `menuSetting` と `menuLogoSetting` の全体。時計とカウントダウンは含めない |
| カウントダウンをリセット | `menuBadgesSetting` の `countdowns` |
| すべての設定をリセット（赤、別のカード） | `storage.local` の全体。内部の控え（コース一覧やメニュー名）も消える |

#### 保存

1. 変更前の値を控え、手元の値を先に新しい値へ更新する
2. 新しい値を `$state.snapshot` で素の値へ直す。手元の値（`$state`）から組んだ値には Proxy が混ざり、Firefox の `storage` は structured clone で写すため Proxy を受け取れない（Firefox では時間割の授業などが2件目から保存できず、復元では `DataCloneError: Proxy object could not be cloned` が出た。どちらも実機で確認）
3. 書き込みを1本の `Promise` の鎖（`saveQueue`）の末尾へ足す。前の書き込みが終わってから、2 の値で `group.write(key, value)` を呼ぶ
4. 書き込みが失敗した場合、`console.error("[mi-mo] settings", error)` を出し、手元の値を控えた値へ戻す。ヘッダの中に「「`<label>`」を保存できませんでした。もう一度操作してください。」を `role="alert"` で出す
5. 次に何かを操作した時点で、そのメッセージを消す

### FieldRow

`meta.control.kind` で描き分ける。

| kind | 使うコンポーネント |
|---|---|
| `toggle` | shadcn の Switch |
| `number` | shadcn の Input（`type="number"`、`min`・`max`・`step` を渡す。`unit` は入力欄の右に添える）。確定（`change`）の時点で `min` と `max` の間へ丸めてから保存する。数として読めない入力は元の値へ戻す |
| `text` | shadcn の Input |
| `date` | `DatePicker`（[`./controls.md`](./controls.md)）。値は `YYYY-MM-DD` の文字列 |
| `select` | shadcn の Select（`type="single"`）。トリガーには選んだ選択肢の `label` を出し、幅は `max-w-48` までにする。選択肢の層は右端へ揃える（`align="end"`） |
| `nested`、`custom` | `OpenRow`（[`./controls.md`](./controls.md)）で行全体を1つのボタンにする。左に `label` と `description`、右に値が配列の場合の件数（「6件」）と右向きの山形を出す。押されたら `onOpen` を呼ぶ。中身は描かない |

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

| Select・Popover・確認のダイアログの開閉 | ライブラリの `fade` と `zoom`。長さは `global.css` で 150ms に揃える |
| 曜日の Accordion の開閉 | ライブラリの `accordion-down`・`accordion-up`（200ms） |

CSS の動きには `motion-reduce:` の指定を添え、OS が動きを減らす設定の間は止める。ライブラリの部品は `global.css` の `prefers-reduced-motion` の指定で止める。

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
- **`when` はグループの値だけを受け取り、別のグループの値を見ない。** 行を出す条件をそのグループの中で閉じ、グループどうしの読み合いを作らない
- **`when` はメソッドの記法で書く。** `FieldsOf<C>` から `Record<string, FieldMeta>` へ型を落とす時に、引数の型が `C` から `unknown` へ広がっても代入できる（メソッドの引数は双変に検査される）
- **`FieldsOf<C>` で全キー分の `FieldMeta` を要求する。** 機能側の Config にキーを足すと `fields.ts` がコンパイルエラーになり、書き忘れが型で止まる
- **`defineGroup` の戻り値は型引数を落とした `SettingsGroup` にする。** 型の違うグループを1つの配列へ並べるため。読み書きは `defineGroup` の中で型が閉じており、描画側は `unknown` だけを見る
- **型を落とす2箇所はキャストで書く。安全性を手放す境界がここだと決める。** `FieldsOf<C>` から `Record<string, FieldMeta>` への代入は、`kind: "custom"` の `Component<CustomFieldProps<V>>` が `V` について不変（`value` と `onChange` の両方で `V` を使うため）で、`Component` 自体も Props に対して反変になるため、キャスト無しでは通らない。`setting.getValue()` の `Promise<C>` も、`C extends object` の制約だけでは `Promise<Record<string, unknown>>` へ代入できない。どちらも `tsc --strict` で確認済み
- **`read` は欠けたキーを補った値を返す。** WXT の `fallback` は何も保存されていない時にだけ効く。項目を後から足した設定では、保存済みの値に新しいキーが無く、そのままでは `select` が何も選ばれていない状態で出る。補うのは `defineSetting` の `getValue` の役目で、`read` では重ねない。補った値を返すため、バックアップの読み込みも新しいキーを取り込める
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
- **`select` は shadcn の Select で描く。** 利用者が、開閉に動きのあるライブラリの部品を望んだため、ネイティブの `<select>` から移した。選択肢は別の層（portal）へ描かれ、bits-ui が画面に収まる高さ（`--bits-select-content-available-height`）へ縮めてスクロールさせる。高さの限られたポップアップで切れないかは、実機で確かめていない（[`../../known-issues.md`](../../known-issues.md)）
- **開いているタブと別の画面を、アドレスの hash（`#<タブ>` か `#<タブ>/<行の id か ResetMenu の id>`）に写す。** `SettingsPanel` が `history.replaceState` で書き、読み込んだ時に hash からタブを選び、最初の読み込みの後に行の画面を一度だけ開き直す。Firefox のポップアップからオプション画面へ移った時に、同じ場所を出すため。書く時に検索部分（`?pick`）を落とし、読み直しで再びボタンへ寄せない
- **Firefox のポップアップでは、ファイルの読み込みをオプション画面へ移す。** Firefox のポップアップはファイル選択のダイアログを開くと閉じ、選んだファイルを受け取れない（実機で確認）。オプション画面はタブで開くため、ダイアログを開いても閉じない
- **ファイルの読み込みは、読めたことを確かめてから上書きを尋ねる。** 読めないファイルで確認を出すと、「読み込む」を押した後に失敗を知ることになる。先に読むと、確認が出た時点で上書きできることが決まっている
- **保存を直列にする。** `write` は読む・差し替える・書くの3手で、同じグループの2項目を続けて変えると、並行した書き込みの後勝ちで先の変更が消える
- **画面をまたぐ書き込みは `navigator.locks` で順に並べる。** ポップアップとオプション画面を同時に開くと、それぞれの `saveQueue` は互いを知らない。Web Locks は同じオリジンの拡張機能のページで共有され、Chrome・Firefox・Safari のどれも対応する。片方の画面の表示は他方の変更を拾わないが、保存では別の項目の変更が消えない
- **失敗した保存は手元の値を巻き戻す。** 画面が保存されていない値を出し続けると、利用者は保存されたと受け取る
- **無効な機能の詳細を描かない。** 効かない項目を並べると、読む量だけが増える。有効にした時点で現れるため、探す手間は増えない
- **カードの区切りを、見出しの一致という1つの規則で決める。** グループは保存先の単位、カードは見た目の単位で、両者は一致しない場合がある（時限表は時計も使うため別の保存先を持ち、画面では時間割のカードに入る）。`title`・`section`・`after` の3つで、保存先を変えずに見た目だけを組み替える
- **一覧や表の中身は、その場で開かず別の画面に出す。** 380px の幅で一覧の途中に編集欄を広げると、前後の行が画面の外へ押し出され、今どこにいるかを見失う。別の画面では、パンくずが場所を示し、編集欄が幅をすべて使える
- **オプション画面はタブで開く（`options/index.html` の `manifest.open_in_tab`）。** Chrome は既定で拡張機能の管理の中のダイアログへ埋め込み、ダイアログの高さを中身から決める。パネルは `h-dvh` で高さを取るため、互いを参照して 0 に潰れ、何も出ない（Chrome で確認）
- **スクロールはパネル自身が持つ。** ポップアップとオプション画面ではスクロールする要素が違う。パネルが持つと、スクロール位置の控えと復帰を1つの要素に対して書ける
- **全体のスイッチは、設定を残したまま全機能を止めるために持つ。** Moodle の表示が崩れた時に、原因が拡張機能かどうかを切り分けられる。拡張機能そのものを無効にすると設定画面も開けなくなる
- **全体のスイッチはタブの中ではなく最上部に置く。** どのタブの機能にも効くため、タブに属させない
- **全体のスイッチが false の間も、設定の編集は止めない。** 止めている間に設定を直してから戻す、という使い方を残す。半透明にして、効いていないことだけを見せる
- **バックアップを持つ。** 拡張機能の入れ直しや別のブラウザへの移行で、時間割や時限表を打ち直さずに済む
- **バックアップの読み込みは、今あるグループとキーで、値の種類が合うものだけを取り込む。** 古い版や手で書き換えたファイルを読んでも、知らないキーや形の違う値が保存先へ入らない
- **バックアップのカードはグループの外に置く。** 保存項目を持たない操作で、`fields` のキーに対応しない
- **リセットは既定値へ戻し、一覧を空にはしない。** 保存値を消せば、読む側の `fallback` がそのまま既定値になる。既定値を2箇所に書かずに済む
- **リセットの対象は、保存項目とキーの組で `reset.ts` に書く。** 行の文言と戻す範囲を1箇所に並べ、確認と結果の文言は `label` から作る
- **リセットも `withSettingLock` の中で書く。** 別の画面が同じ項目を書いている途中で戻すと、後から書かれた値でリセットが消える
- **「すべての設定をリセット」は保存領域を丸ごと空にする。** 項目を1つずつ並べると、後から足した項目や内部の控えが残る
- **リセットの行の色は、範囲の大きい「すべて」の操作だけを赤にし、確認のボタンはどれも赤にする。** 3段階の色の使い分けは [`../../ui-principles.md`](../../ui-principles.md) に従う
- **値の整え方は、部品ではなく `fields.ts` の `prune` と `normalize` に書き、`SettingsPanel` が呼ぶ。** 部品が閉じる時の後始末を自分で持つと、別の画面を閉じる経路ごとに呼び忘れが起きる。整える規則は値の形を知る側に置き、呼ぶ時機は画面の入れ替えを知る側に置く
- **`prune` は「戻る」でだけ呼ぶ。** 書きかけの行を入力の途中で消すと、追加した直後の空行も消える。画面を離れる時点なら書き終えている
- **`normalize` は `replace` でだけ呼ぶ。** 画面の操作で書く値は部品が今の形で作る。形が古い値が入り得るのは、ファイルから取り込む時だけ
- **一覧が長い `custom` は `fill` で画面の高さに収める。** 画面全体がスクロールすると、ヘッダの下で一覧の端が見えなくなる。一覧の中でだけスクロールさせると、パンくずと「戻る」が常に見える
- **設定の検索とプロファイルの切り替えは作らない。** 3つのタブに収まる量で、探す手段を足すほどの項目数が無い
- **画面自体の設定（テーマの手動切り替えなど）は持たない。** 仕様書が「この画面自体の設定はない」と定めている
