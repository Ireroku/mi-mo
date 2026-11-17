# settings timetableFields モジュール

## 概要

時間割の設定を編集する。曜日と時限のコマ、休講日、振替日を専用のエディタで扱い、時間割のファイルの出し入れと `.ics` の書き出しボタンもここに置く。

## 関連

- 使う: [`./panel.md`](./panel.md) — `CustomFieldProps` の形、`footer` の差し込み口と `FooterProps`、`BackupButtons`
- 使う: [`../utils/download.md`](../utils/download.md) — `.ics` を保存する `saveBlob`
- 使う: [`../timetable/schedule.md`](../timetable/schedule.md) — `TimetableConfig` と関連する型
- 使う: [`../timetable/ics.md`](../timetable/ics.md) — `buildIcs` と `ICS_FILENAME`
- 使う: [`../utils/periods.md`](../utils/periods.md) — 時限の並び、番号、名前（`periodName`）
- 使う: [`./controls.md`](./controls.md) — 科目名と URL、休講日と振替日の日付と2つ目の欄を重ねる `StackedInputs`、日付の `DatePicker`
- 参考: [`./menuFields.md`](./menuFields.md) — `ListField` を使った配列の編集

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/settings/fields/TimetableGridField.svelte` | 曜日と時限のコマの編集 |
| `src/features/settings/fields/HolidayListField.svelte` | 休講日の編集 |
| `src/features/settings/fields/SubstituteListField.svelte` | 振替日の編集 |
| `src/features/settings/fields/IcsExportButton.svelte` | `.ics` の書き出し |
| `src/features/settings/fields/TimetableFooter.svelte` | 時間割のファイルの出し入れと、`IcsExportButton` を並べる |
| `src/features/settings/fields.ts` | 時間割グループの定義を足す |

## インターフェース

3つのエディタは [`./panel.md`](./panel.md) の `CustomFieldProps<V>` をそのまま受け取る。

| コンポーネント | `V` |
|---|---|
| `TimetableGridField` | `Record<Weekday, (TimetableSlot \| null)[]>` |
| `HolidayListField` | `TimetableHoliday[]` |
| `SubstituteListField` | `TimetableSubstitute[]` |

`TimetableFooter` は [`./panel.md`](./panel.md) の `FooterProps` を受け取る。`IcsExportButton` は props を取らない。

```ts
// src/features/settings/fields/TimetableFooter.svelte
const TIMETABLE_FILENAME = "mi-mo-timetable.json";

// ファイルで出し入れするキー。時間割と時限表の2つのグループにまたがる
const TIMETABLE_FILE_KEYS: readonly (keyof TimetableConfig)[] = [
  "grid",
  "holidays",
  "substitutes",
  "startDate",
  "lessonCount",
];
const PERIOD_FILE_KEYS: readonly (keyof PeriodTableConfig)[] = ["periods"];
const SCOPE: BackupScope = {
  [timetableSetting.key]: TIMETABLE_FILE_KEYS,
  [periodTableSetting.key]: PERIOD_FILE_KEYS,
};
```

`fields.ts` へ足すグループ:

```ts
defineGroup(
  "home",
  "時間割",
  timetableSetting,
  {
    enabled: { label: "時間割を表示する", control: { kind: "toggle" } },
    // この位置へ、時限表の「各時限の時刻」が差し込まれる（./menuFields.md）
    grid: {
      label: "授業科目の設定",
      control: { kind: "custom", component: TimetableGridField },
    },
    holidays: {
      label: "休講日",
      control: { kind: "custom", component: HolidayListField },
    },
    substitutes: {
      label: "振替日",
      control: { kind: "custom", component: SubstituteListField },
    },
    startDate: { label: "学期の開始日", control: { kind: "date" } },
    lessonCount: {
      label: "授業の回数",
      description: "1つの授業が何回で終わるか",
      control: { kind: "number", min: 1, max: 30, unit: "回" },
    },
    color: {
      label: "配色",
      control: {
        kind: "select",
        options: [
          { value: "moodle", label: "Moodle" },
          { value: "white", label: "白" },
          { value: "black", label: "黒" },
          { value: "sky", label: "水色" },
          { value: "pink", label: "ピンク" },
          { value: "green", label: "緑" },
        ],
      },
    },
    syncCountdown: {
      label: "カウントダウンを時間割に合わせる",
      description: "「全体」タブのカウントダウン「今の時限の残り時間」で、授業のある時限だけを数えます",
      // 授業が1つも無い間は、合わせる先が無い
      when: hasLessons,
      control: { kind: "toggle" },
    },
  },
  { footer: TimetableFooter },
),
```

## 処理の流れ

### TimetableGridField

1. 月曜から金曜を shadcn の Accordion（`type="single"`）で縦に並べる。同時に開くのは1つの曜日だけで、開いた曜日をもう一度押すと閉じる。既定はすべて閉じる
2. 開いた曜日の中に、時限表の配列の順で時限ごとの行を出す。時限表は開いた時に `periodTableSetting` から一度だけ読む
3. 各行の上に「`<時限の名前>`（`<開始時刻>`）」を1行で出す（`text-note font-normal text-muted-foreground`、折り返さない）。名前は `periodName` で取る
4. その下へ、`StackedInputs`（[`./controls.md`](./controls.md)）で科目名の入力を上、URL の入力を下に重ねて置く
5. 入力は、曜日の配列の `period - 1` の位置へ書く。配列の位置は時限の番号で決まり、時限表の並び順とは関係しない
6. 科目名が空の行は `null` として保存する
7. 時限表より配列が短い場合、足りない分は空のコマとして扱う

### HolidayListField

`ListField` を使う。行は `StackedInputs` で、`DatePicker`（[`./controls.md`](./controls.md)）を上、理由のテキスト入力を下に積む。`createItem` は `{ date: "" }` を返す。

### SubstituteListField

`ListField` を使う。行は `StackedInputs` で、`DatePicker` を上、曜日のセレクト（月曜から金曜）を下に積む。`createItem` は `{ date: "", weekday: "mon" }` を返す。

### TimetableFooter

上から、ファイルの出し入れ、`IcsExportButton` の順に並べる。説明文は置かない。上書きは読み込みの前の確認が伝える。

1. `BackupButtons` へ、受け取った `values` と `onRestore`、`filename`（`TIMETABLE_FILENAME`）、`scope`（`SCOPE`）、`noun`（「時間割」）を渡す。書き出しと読み込みの手順は [`./panel.md`](./panel.md) の「バックアップ」が持つ
2. 時限表を持たない古いファイルを読んだ場合、`parseScopedBackup` は時間割のグループだけを返し、時限表は今の値を残す

### IcsExportButton

ボタンの文言は「カレンダー予定ファイルとして書き出す (.ics)」。

1. `timetableSetting` と `periodTableSetting` を読む
2. `buildIcs(config, periodTable.periods)` で文字列を作る
3. `Blob` を `text/calendar;charset=utf-8` で作り、`saveBlob` で `ICS_FILENAME` として保存する

## 決めごと

- **グリッドを表ではなく、曜日ごとの折りたたみで編集する。** ポップアップの幅は 380px しかなく、5曜日を横に並べると1列 70px ほどになり、科目名を入力できない。縦に積めば狭い幅でも成立する
- **毎学期に変える項目（科目、休講日、振替日）を上、決めたら触らない項目（開始日、回数、配色）を下に並べる。** [`./panel.md`](./panel.md) の「項目を足す時の規約」に従う
- **折りたたみは既定で閉じる。** 開いた状態で入ると、最初の曜日の時限が画面を埋め、他の曜日を探しにくい
- **科目名が空のコマを `null` として保存する。** 空文字のコマが残ると、表示側が空きコマと区別できない
- **時限の数を時間割側に持たせず、時限表から取る。** 同じ数を2箇所に持つと食い違う
- **「カウントダウンを時間割に合わせる」は、時間割に授業がある間だけ出す。** 授業が無い間は合わせる先が無く、切り替えても何も変わらない。判定は `hasLessons`（[`../timetable/schedule.md`](../timetable/schedule.md)）に任せる
- **「カウントダウンを時間割に合わせる」は時間割のグループに置き、既定でオンにする。** 時間割を入れた利用者には、授業の無い時限を数える理由が少ない。効く先はカウントダウンでも、合わせる元の時間割を入れる場所で決める
- **時間割のファイルには、時間割の中身（科目、休講日、振替日、開始日、回数）と時限表を入れる。** 同じ授業を取る人へ渡して使う場面を想定する。授業は時限の番号で時限表の枠を指すため、時限表が違うと授業が別の時限に出るか、出なくなる。表示の入り切り、配色、カウントダウンを合わせるかは受け取る側の好みのため、入れない
- **曜日は1つずつ開く。** 5曜日を同時に開くと、閉じ忘れた曜日が画面を埋める。1つ開くと他が閉じるため、今どの曜日を直しているかが常に1つに決まる
- **科目名と URL を1つの枠に重ねる。** 2つの入力が同じ授業のものだと、枠の形で示す。380px の幅で横に並べると、どちらの欄も短くて読めない
- **休講日と振替日の行も、日付と2つ目の欄を1つの枠に重ねる。** 380px の幅で横に並べると、日付の欄と理由の placeholder が欠ける。削除ボタンは枠の外に置く
- **時間割のファイルはバックアップと同じ形式にし、同じ部品で出し入れする。** 形式を2つ持たない。バックアップのファイルを時間割の読み込みへ渡しても、時間割の中身だけが入る
- **`IcsExportButton` は自分で設定を読む。** 画面が持つ値ではなく、保存済みの値と時限表から組み立てるため。設定画面は設定を扱うモジュールなので、`src/utils/settings.ts` を参照してよい。この制約は `src/features/` の各機能（設定の出所を知らない）とは別
- **書き出しは押した時に組み立てる。** あらかじめ作って持たない。設定を変えた直後でも、その時点の内容が出る
- **学期の開始日に既定値を置く。** 空のままでは実日程を組み立てられない。その年の4月1日を初期値にする
- **振替日と休講日が同じ日に指定された場合、休講を優先する。** 実日程の組み立て（[`../timetable/schedule.md`](../timetable/schedule.md)）が休講を先に見る順序に合わせる
