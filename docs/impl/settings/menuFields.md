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
| `src/features/settings/fields.ts` | 上部メニュー・時計とカウントダウン・時限表のグループの定義を足す |

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
    row: Snippet<[T, (next: T) => void, number]>; // 3つ目は行の位置。行ごとに違う id を作るのに使う
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

`fields.ts` へ足すグループ:

```ts
defineGroup("general", "上部メニュー", menuSetting, {
  hidden: {
    label: "隠す項目",
    description: "名称が一致する項目を非表示にします",
    control: { kind: "custom", component: HiddenMenuItemsField },
  },
  items: {
    label: "追加する項目",
    control: { kind: "custom", component: NewMenuItemsField },
  },
}),
// title が同じで隣り合うため、上の2行と同じカードに入る
defineGroup("general", "上部メニュー", menuLogoSetting, {
  hidden: { label: "ロゴを隠す", control: { kind: "toggle" } },
}),
// section で、1つの保存先を「時計」と「カウントダウン」の2枚のカードへ分ける
defineGroup("general", "時計", menuBadgesSetting, {
  clock: {
    label: "時計のオプション",
    control: {
      kind: "nested",
      fields: {
        showSeconds: { label: "秒", control: { kind: "toggle" } },
        hour12: { label: "12時間表記", control: { kind: "toggle" } },
        showDate: { label: "日付", control: { kind: "toggle" } },
        showYear: { label: "年", control: { kind: "toggle" } },
        showWeekday: { label: "曜日", control: { kind: "toggle" } },
        showPeriod: { label: "時限", control: { kind: "toggle" } },
      },
    },
  },
  countdowns: {
    label: "表示する項目",
    section: "カウントダウン",
    control: {
      kind: "custom",
      component: CountdownListField,
      // ラベルも日時も入っていない行は、足しただけの行として閉じる時に消す。時限の対象はラベルを持たない
      prune: (list) =>
        list.filter(
          (item) =>
            item.source.kind === "nextPeriod" ||
            item.label.trim() !== "" ||
            item.source.at !== "",
        ),
    },
  },
}),
// after で、「ホーム」タブの時間割のカードへ、入り切りの直後に差し込む
defineGroup(
  "home",
  "時限表",
  periodTableSetting,
  {
    periods: {
      label: "各時限の時刻",
      description: "時計の時限表示にも使用します",
      section: "時間割",
      control: { kind: "custom", component: PeriodTableField },
    },
  },
  { after: rowId(timetableSetting.key, "enabled") },
),
```

`title`・`section`・`after` の働きは [`./panel.md`](./panel.md) の「カードの区切り」が持つ。`nested` の子の `section` と、`prune` の呼ばれ方は [`./panel.md`](./panel.md) の「別の画面」が持つ。

## 処理の流れ

### ListField

1. `items` を行として並べ、各行に `row` スニペットを `(item, update, index)` で呼ぶ
2. 各行の右上に、行の枠の外へ削除ボタンを置く。行が2段に積まれても、中の欄と重ならない。押された行を除いた配列で `onChange` を呼ぶ
3. 一覧の下に `addLabel` のボタンを置き、`createItem()` を末尾へ足した配列で `onChange` を呼ぶ
4. `update` が呼ばれたら、その行だけを差し替えた配列で `onChange` を呼ぶ
5. 行の間は `gap-3` にする。行の下に添え物（追加するメニュー項目の「別タブで開く」）があっても、次の行の欄と詰まらない

### HiddenMenuItemsField

行はテキスト入力1つ。`createItem` は空文字を返す。

### NewMenuItemsField

行は、`StackedInputs` で積んだテキスト入力2つ（表示名の `text`・URL の `href`）と、その下の「別タブで開く」のトグル1つ。トグルは枠の外に置く。`createItem` は `{ text: "", href: "", newTab: false }` を返す。

トグルの `id` は `$props.id()` と行の位置から作る（`<id>-newtab-<index>`）。設定ページの中で `id` が重ならず、ラベルを押すとその行のトグルが切り替わる。

### PeriodTableField

行は数値入力1つ（`period`）と時刻入力2つ（`start`・`end`）。時刻入力は `type="time"` を使い、値は `HH:MM` の文字列をそのまま保存する。番号の欄は幅を固定し（`w-10`）、時刻の欄2つが残りの幅を分け合う（`min-w-0 flex-1`）。ポップアップの幅（380px）で時刻が欠けない形にする。`createItem` は、いま並んでいる最大の `period` に1を足した番号と、空の時刻を返す。

### CountdownListField

行は `StackedInputs` で縦に積む。1段目が対象を選ぶセレクト。選択肢は「今の時限の残り時間」（`{ kind: "nextPeriod" }`）と「日時を指定」（`{ kind: "fixedDate" }`）の2つ。

「日時を指定」を選んだ行だけ、2段目にテキスト入力（`label`、プレースホルダーは `ラベル（例: 定期試験 開始まで）`）、3段目に日時入力（`type="datetime-local"`）を出し、日時の値を `source.at` へ入れる。`StackedInputs` の下に `ラベルは空白の位置で改行します` の注記（`text-note text-muted-foreground`）を添える。

「今の時限の残り時間」の行はセレクトだけになる。ラベルは表示する側が自動で作る（[`../menu/countdownBadge.md`](../menu/countdownBadge.md)）。対象を切り替えても入力済みのラベルは残し、保存したまま使わない。

`createItem` は `{ id: crypto.randomUUID(), label: "", source: { kind: "fixedDate", at: "" } }` を返す。

`fields.ts` の `prune` は、「日時を指定」でラベルが空白だけで、日時も入っていない行を消す。「今の時限の残り時間」の行は消さない。「戻る」を押した時に [`./panel.md`](./panel.md) が呼ぶ。

## 決めごと

- **4つのエディタで配列の操作を書き直さず、`ListField` に集める。** 行の追加・削除・差し替えはどれも同じ手順になる
- **`id` は自動で振り、画面に出さない。** `CountdownConfig.id` は内部の識別子で、ユーザーが決める意味が無い
- **`source.at` は `datetime-local` の値をそのまま保存する。** `buildCountdownTargets` が `new Date(source.at)` で解釈するため、`YYYY-MM-DDTHH:MM` の形がそのまま通る
- **時限表を保存時に並べ替えない。** 読み込む側（`initMenuBadges`）が `sortByStart` で開始時刻の順に整えるため、画面側で二重に持たない
- **省略可能なキーは `undefined` を空配列として扱う。** `MenuConfig` の `hidden` と `items` はどちらも省略可能で、未設定のまま編集を始める場合がある。`ListField` の `items` は `undefined` を受けないため、`HiddenMenuItemsField` と `NewMenuItemsField` の中で `value ?? []` を挟んでから渡す
- **メニュー項目の挿入位置（`NewMenuItem.position`）は編集させない。** 指定には既存の項目名を正確に知る必要があり、手入力では実用にならない。位置を省略した場合の既定の挙動に任せる
- **隠す項目の候補を Moodle から自動で集めない。** 集めるには Moodle のページで採った項目名を保存しておく仕組みが要る。名前の手入力から始め、候補が欲しくなった時点で [`../menu/navbar.md`](../menu/navbar.md) 側へ収集を足す
- **時限表は、保存先を時計と共有したまま、画面では時間割のカードに置く。** 時刻を決める動機は時間割の入力にあり、利用者は時間割の近くを探す。時計だけを使う利用者のために、説明へ時計にも効くことを書く。時間割を無効にしている間も、この行は残る
- **並べ替え（ドラッグでの入れ替え）は作らない。** 時限表は開始時刻で自動的に整い、他の3項目は並び順が表示に影響しない
