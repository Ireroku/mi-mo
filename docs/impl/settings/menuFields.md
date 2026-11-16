# settings menuFields モジュール

## 概要

設定画面のうち、汎用のコントロールで表せない項目の専用エディタを置く。対象は配列を持つ4項目（隠すメニュー項目、追加するメニュー項目、時限表、カウントダウン）。どれも「行を足す・消す」形になるため、共通の枠を1つ作り、行の中身だけを差し替える。

## 関連

- 使う: [`./panel.md`](./panel.md) — `CustomFieldProps` の形と、`kind: "custom"` の差し込み口
- 使う: [`../menu/navbar.md`](../menu/navbar.md) — `MenuConfig` と `NewMenuItem` の型
- 使う: [`../menu/clock.md`](../menu/clock.md) — `ClockConfig` の型
- 使う: [`../utils/periods.md`](../utils/periods.md) — `PeriodSlot` と `PeriodTableConfig` の型
- 使う: [`../menu/countdownBadge.md`](../menu/countdownBadge.md) — `CountdownConfig` と `CountdownSource` の型
- 資料: [`../../features/ui/menu.md`](../../features/ui/menu.md) — メニュー項目の削除と追加でユーザーが何をしたいか

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/settings/fields/ListField.svelte` | 行の追加と削除を扱う共通の枠 |
| `src/features/settings/fields/HiddenMenuItemsField.svelte` | 隠すメニュー項目の編集 |
| `src/features/settings/fields/NewMenuItemsField.svelte` | 追加するメニュー項目の編集 |
| `src/features/settings/fields/PeriodTableField.svelte` | 時限表の編集 |
| `src/features/settings/fields/CountdownListField.svelte` | カウントダウン対象の編集 |
| `src/features/settings/fields.ts` | menu 系2グループの定義を足す |

## インターフェース

```svelte
<!-- src/features/settings/fields/ListField.svelte -->
<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  interface Props {
    items: readonly T[];
    onChange: (next: T[]) => void;
    createItem: () => T;
    addLabel: string;
    row: Snippet<[T, (next: T) => void]>;
  }
</script>
```

各エディタは [`./panel.md`](./panel.md) の `CustomFieldProps<V>` をそのまま受け取る。

| コンポーネント | `V` |
|---|---|
| `HiddenMenuItemsField` | `string[] \| undefined` |
| `NewMenuItemsField` | `NewMenuItem[] \| undefined` |
| `PeriodTableField` | `PeriodSlot[]` |
| `CountdownListField` | `CountdownConfig[]` |

`fields.ts` へ足す2グループ:

```ts
defineGroup("general", "上部メニュー", menuSetting, {
  hidden: {
    label: "隠す項目",
    description: "上部メニューから消す項目の名前",
    control: { kind: "custom", component: HiddenMenuItemsField },
  },
  items: {
    label: "追加する項目",
    control: { kind: "custom", component: NewMenuItemsField },
  },
}),
defineGroup("general", "時計とカウントダウン", menuBadgesSetting, {
  clock: {
    label: "時計の表示",
    control: {
      kind: "nested",
      fields: {
        showSeconds: { label: "秒を表示する", control: { kind: "toggle" } },
        showDate: { label: "日付を表示する", control: { kind: "toggle" } },
        showWeekday: { label: "曜日を表示する", control: { kind: "toggle" } },
        showPeriod: { label: "時限を表示する", control: { kind: "toggle" } },
      },
    },
  },
  countdowns: {
    label: "カウントダウン",
    control: { kind: "custom", component: CountdownListField },
  },
}),
defineGroup("general", "時限表", periodTableSetting, {
  periods: {
    label: "各時限の時刻",
    description: "時計の時限表示と時間割の両方が使う",
    control: { kind: "custom", component: PeriodTableField },
  },
}),
```

## 処理の流れ

### ListField

1. `items` を行として並べ、各行に `row` スニペットを `(item, update)` で呼ぶ
2. 各行の右端に削除ボタンを置き、押された行を除いた配列で `onChange` を呼ぶ
3. 一覧の下に `addLabel` のボタンを置き、`createItem()` を末尾へ足した配列で `onChange` を呼ぶ
4. `update` が呼ばれたら、その行だけを差し替えた配列で `onChange` を呼ぶ

### HiddenMenuItemsField

行はテキスト入力1つ。`createItem` は空文字を返す。

### NewMenuItemsField

行はテキスト入力2つ（`text`・`href`）と、新しいタブで開くかのトグル1つ。`createItem` は `{ text: "", href: "" }` を返す。

### PeriodTableField

行は数値入力1つ（`period`）と時刻入力2つ（`start`・`end`）。時刻入力は `type="time"` を使い、値は `HH:MM` の文字列をそのまま保存する。`createItem` は、いま並んでいる最大の `period` に1を足した番号と、空の時刻を返す。

### CountdownListField

行はテキスト入力1つ（`label`）と、対象を選ぶセレクト1つ。セレクトの選択肢は「次の時限」（`{ kind: "nextPeriod" }`）と「日時を指定」（`{ kind: "fixedDate" }`）の2つ。

「日時を指定」を選んだ行だけ、日時入力（`type="datetime-local"`）を追加で出し、その値を `source.at` へ入れる。

`createItem` は `{ id: crypto.randomUUID(), label: "", source: { kind: "nextPeriod" } }` を返す。

## 決めごと

- **4つのエディタで配列の操作を書き直さず、`ListField` に集める。** 行の追加・削除・差し替えはどれも同じ手順になる
- **`id` は自動で振り、画面に出さない。** `CountdownConfig.id` は内部の識別子で、ユーザーが決める意味が無い
- **`source.at` は `datetime-local` の値をそのまま保存する。** `buildCountdownTargets` が `new Date(source.at)` で解釈するため、`YYYY-MM-DDTHH:MM` の形がそのまま通る
- **時限表を保存時に並べ替えない。** 読み込む側（`initMenuBadges`）が `sortByStart` で開始時刻の順に整えるため、画面側で二重に持たない
- **省略可能なキーは `undefined` を空配列として扱う。** `MenuConfig` の `hidden` と `items` はどちらも省略可能で、未設定のまま編集を始める場合がある。`ListField` の `items` は `undefined` を受けないため、`HiddenMenuItemsField` と `NewMenuItemsField` の中で `value ?? []` を挟んでから渡す
- **メニュー項目の挿入位置（`NewMenuItem.position`）は編集させない。** 指定には既存の項目名を正確に知る必要があり、手入力では実用にならない。位置を省略した場合の既定の挙動に任せる
- **隠す項目の候補を Moodle から自動で集めない。** 集めるには Moodle のページで採った項目名を保存しておく仕組みが要る。名前の手入力から始め、候補が欲しくなった時点で [`../menu/navbar.md`](../menu/navbar.md) 側へ収集を足す
- **並べ替え（ドラッグでの入れ替え）は作らない。** 時限表は開始時刻で自動的に整い、他の3項目は並び順が表示に影響しない
