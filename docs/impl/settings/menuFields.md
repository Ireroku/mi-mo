# settings menuFields モジュール

## 概要

設定画面のうち、汎用のコントロールで表せない項目の専用エディタを置く。対象は配列を持つ4項目（隠すメニュー項目、追加するメニュー項目、時限表、カウントダウン）。どれも「行を足す・消す」形になるため、共通の枠を1つ作り、行の中身だけを差し替える。

## 関連

- 使う: [`./panel.md`](./panel.md) — `CustomFieldProps` の形と、`kind: "custom"` の差し込み口
- 使う: [`../menu/navbar.md`](../menu/navbar.md) — `MenuConfig` と `NewMenuItem` の型
- 使う: [`../menu/clock.md`](../menu/clock.md) — `ClockConfig` の型
- 使う: [`../utils/periods.md`](../utils/periods.md) — `PeriodSlot` と `PeriodTableConfig` の型、`defaultPeriodName` と `nextPeriodNumber`
- 使う: [`./controls.md`](./controls.md) — 時限表の時刻に使う `TimePicker`、行の欄を積む `StackedInputs`、候補付きの入力欄 `SuggestInput`
- 使う: [`../moodle/menuItems.md`](../moodle/menuItems.md) — 隠す項目の候補にする、Moodle で控えたメニュー項目名（`menuItemsCacheSetting`）
- 使う: [`../menu/countdownBadge.md`](../menu/countdownBadge.md) — `CountdownConfig` と `CountdownSource` の型
- 資料: [`../../features/ui/menu.md`](../../features/ui/menu.md) — メニュー項目の削除と追加でユーザーが何をしたいか

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/settings/fields/ListField.svelte` | 行の追加と削除を扱う共通の枠。時限表は使わない |
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
      // 子の section が変わる所でカードを分ける。空の section は見出しを出さずに区切る
      fields: {
        hour12: { label: "12時間表記", section: "時間表記", control: { kind: "toggle" } },
        showYear: { label: "年", section: "", control: { kind: "toggle" } },
        showDate: { label: "日付", section: "", control: { kind: "toggle" } },
        showWeekday: { label: "曜日", section: "", control: { kind: "toggle" } },
        showSeconds: { label: "秒", section: "", control: { kind: "toggle" } },
        showPeriod: { label: "時限", section: "", control: { kind: "toggle" } },
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
  // 同じ section のため、カウントダウンのカードの中に入る
  thresholds: {
    label: "残り時間の刻み",
    section: "カウントダウン",
    control: {
      kind: "nested",
      fields: {
        secondsWithinMinutes: { label: "秒まで出す", control: { kind: "number", min: 1, max: 60, unit: "分前から" } },
        minutesWithinHours: { label: "分まで出す", control: { kind: "number", min: 1, max: 72, unit: "時間前から" } },
        hoursWithinDays: { label: "日と時間を出す", control: { kind: "number", min: 1, max: 30, unit: "日前から" } },
      },
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

行は `SuggestInput`（[`./controls.md`](./controls.md)）1つ。`createItem` は空文字を返す。

1. `menuItemsCacheSetting`（[`../utils/settings.md`](../utils/settings.md)）から、Moodle を開いた時に控えた項目名を読む
2. 行ごとに、他の行にある名前を除いたものを `suggestions` として渡す。その行自身の名前は残し、候補の中で選んだ状態として見せる
3. 控えが空の場合（Moodle をまだ開いていない）は候補が出ず、名前を書くだけになる。候補に無い名前も書ける

### NewMenuItemsField

行は、`StackedInputs` で積んだテキスト入力2つ（表示名の `text`・URL の `href`）と、その下の「別タブで開く」のトグル1つ。トグルは枠の外に置く。`createItem` は `{ text: "", href: "", newTab: false }` を返す。

トグルの `id` は `$props.id()` と行の位置から作る（`<id>-newtab-<index>`）。設定ページの中で `id` が重ならず、ラベルを押すとその行のトグルが切り替わる。

### PeriodTableField

`ListField` を使わず、`svelte-dnd-action` の `dragHandleZone` で行をドラッグして並べ替えられる一覧を自前で描く。配列の順が、そのまま時間割の行の順になる（[`../utils/periods.md`](../utils/periods.md)）。

行は左から、持ち手・名前・時刻2つ・削除ボタン。

1. 持ち手（`GripVertical`）に `dragHandle` を付け、`aria-label` に「`<名前>`を並べ替える」を書く。持ち手の外を押しても行は動かない。キーボードでは、持ち手へフォーカスして Enter か Space で掴み、矢印キーで動かす
2. 名前はテキスト入力1つ。値は `name`、placeholder は `defaultPeriodName(period)`。空にした場合は `name` を消し、既定の名前へ戻す。`period`（番号）は画面に出さず、編集もさせない
3. 時刻は `TimePicker`（[`./controls.md`](./controls.md)）を2つ、「〜」で挟んで並べる。値は `HH:MM` の文字列
4. 名前の欄は伸び（`min-w-28 flex-1`）、時刻の2つは縮めない（`shrink-0`）。名前と時刻の入れ物は折り返す（`flex-wrap`）。380px の幅では時刻が名前の下へ回り、広い設定ページでは1行に並ぶ。時計のボタンが欠けない
5. 並べ替えの部品は `id` を持つ項目を求めるため、`{ id: period, slot }` の形に包んで渡す。`consider` の間は部品から届いた並びで手元の配列を上書きし、`finalize` で `slot` だけを取り出して `onChange` を呼ぶ
6. 並べ替えの動き（`flipDurationMs`）は 150ms。OS が動きを減らす設定の間は 0 にする。設定の変化は `svelte/reactivity` の `MediaQuery` で追う
7. 一覧の下の「時限を追加」は、`nextPeriodNumber` の番号と空の時刻を持つ枠を末尾へ足す。`taken` には、時間割に授業の入っている番号を渡す。番号は画面を開いた時に `timetableSetting` から一度だけ集める

### CountdownListField

行は `StackedInputs` で縦に積む。1段目が対象を選ぶセレクト。選択肢は「今の時限の残り時間」（`{ kind: "nextPeriod" }`）と「日時を指定」（`{ kind: "fixedDate" }`）の2つ。

「日時を指定」を選んだ行だけ、2段目にテキスト入力（`label`、プレースホルダーは `ラベル（例: 定期試験 開始まで）`）、3段目に日時入力（`type="datetime-local"`）を出し、日時の値を `source.at` へ入れる。`StackedInputs` の下に `ラベルは空白の位置で改行します` の注記（`text-note text-muted-foreground`）を添える。

「今の時限の残り時間」の行はセレクトだけになる。ラベルは表示する側が自動で作る（[`../menu/countdownBadge.md`](../menu/countdownBadge.md)）。対象を切り替えても入力済みのラベルは残し、保存したまま使わない。

`createItem` は `{ id: crypto.randomUUID(), label: "", source: { kind: "fixedDate", at: "" } }` を返す。

`fields.ts` の `prune` は、「日時を指定」でラベルが空白だけで、日時も入っていない行を消す。「今の時限の残り時間」の行は消さない。「戻る」を押した時に [`./panel.md`](./panel.md) が呼ぶ。

## 決めごと

- **並べ替えの無い3つのエディタは、配列の操作を書き直さず `ListField` に集める。** 行の追加・削除・差し替えはどれも同じ手順になる。時限表は並べ替えの部品が一覧の要素そのものに付くため、`ListField` の外で描く
- **`id` は自動で振り、画面に出さない。** `CountdownConfig.id` は内部の識別子で、ユーザーが決める意味が無い
- **`source.at` は `datetime-local` の値をそのまま保存する。** `buildCountdownTargets` が `new Date(source.at)` で解釈するため、`YYYY-MM-DDTHH:MM` の形がそのまま通る
- **時限表を保存時に開始時刻で並べ替えない。** 配列の順は時間割の表示の順として利用者が決める。時計は読む側（`initMenuBadges`）が `sortByStart` で開始時刻の順に整える
- **省略可能なキーは `undefined` を空配列として扱う。** `MenuConfig` の `hidden` と `items` はどちらも省略可能で、未設定のまま編集を始める場合がある。`ListField` の `items` は `undefined` を受けないため、`HiddenMenuItemsField` と `NewMenuItemsField` の中で `value ?? []` を挟んでから渡す
- **メニュー項目の挿入位置（`NewMenuItem.position`）は編集させない。** 指定には既存の項目名を正確に知る必要があり、手入力では実用にならない。位置を省略した場合の既定の挙動に任せる
- **隠す項目は、Moodle で控えた項目名を候補に出し、候補に無い名前も書けるようにする。** 正確な名前を手で打つと一字違いで効かない。一方で、控えは最後に開いたページの項目しか持たず、Moodle が項目を足すこともあるため、候補だけに絞らない
- **時計のオプションは、表記の切り替えを先頭の「時間表記」のカードに置き、出す要素を見出しの無いカードに、日付に関わるものから時刻に関わるものへ（年・日付・曜日・秒・時限）並べる。** 表記の切り替えは他の項目と働きが違い、出す要素と混ぜると探しにくい。出す要素は時計の表示に近い順にすると、どの項目がどこに効くかを読み取れる
- **カウントダウンは、対象・ラベル・日時を横に並べず縦に積む。** 380px の幅で3つを1行に置くと日時の欄が欠ける
- **対象を先頭に置き、ラベルの欄は「日時を指定」の時だけ出す。** 「今の時限の残り時間」のラベルは自動で決まり、書いても使われない欄を出すと、効かない入力に見える
- **改行の位置を注記で伝える。** ラベルは1行4文字で折れる。空白で折れることを知らないと、意図しない位置で切れる
- **足した行の既定の対象は「日時を指定」にする。** 「今の時限の残り時間」は1つあれば足り、追加で増やすのは日時の対象のため
- **書きかけで空のカウントダウンは「戻る」で消す。** 「追加」を押しただけの行が残ると、メニューに名前の無いバッジが並ぶ。「今の時限の残り時間」はラベルも日時も持たないため、消さない
- **時限表は、保存先を時計と共有したまま、画面では時間割のカードに置く。** 時刻を決める動機は時間割の入力にあり、利用者は時間割の近くを探す。時計だけを使う利用者のために、説明へ時計にも効くことを書く。時間割を無効にしている間も、この行は残る
- **時限表だけ、ドラッグで並べ替えられるようにする。** 時限の名前を自由に付けられるため（「1-2限」のようなまとめた枠など）、時間割に出す順は利用者が決める。他の3項目の並べ替えは作らない
- **並べ替えは持ち手でだけ始める。** 行の中に入力欄と時計のボタンがあり、行のどこでも掴めると、入力や選択のつもりの操作がドラッグになる
- **時限の番号を画面から消す。** 番号は授業の置き場所を指す変わらない値で、利用者が変えると時間割の授業が別の時限へずれる。名前と並びは自由に変えてよく、番号は追加の時にだけ振る
