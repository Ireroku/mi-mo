# settings timetableFields モジュール

## 概要

時間割の設定を編集する。曜日と時限のコマ、休講日、振替日を専用のエディタで扱い、`.ics` の書き出しボタンもここに置く。

## 関連

- 使う: [`./panel.md`](./panel.md) — `CustomFieldProps` の形と、`footer` の差し込み口
- 使う: [`../timetable/schedule.md`](../timetable/schedule.md) — `TimetableConfig` と関連する型
- 使う: [`../timetable/ics.md`](../timetable/ics.md) — `buildIcs` と `ICS_FILENAME`
- 使う: [`../utils/periods.md`](../utils/periods.md) — 時限の数と番号
- 参考: [`./menuFields.md`](./menuFields.md) — `ListField` を使った配列の編集

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/settings/fields/TimetableGridField.svelte` | 曜日と時限のコマの編集 |
| `src/features/settings/fields/HolidayListField.svelte` | 休講日の編集 |
| `src/features/settings/fields/SubstituteListField.svelte` | 振替日の編集 |
| `src/features/settings/fields/IcsExportButton.svelte` | `.ics` の書き出し |
| `src/features/settings/fields.ts` | 時間割グループの定義を足す |

## インターフェース

3つのエディタは [`./panel.md`](./panel.md) の `CustomFieldProps<V>` をそのまま受け取る。

| コンポーネント | `V` |
|---|---|
| `TimetableGridField` | `Record<Weekday, (TimetableSlot \| null)[]>` |
| `HolidayListField` | `TimetableHoliday[]` |
| `SubstituteListField` | `TimetableSubstitute[]` |

`IcsExportButton` は props を取らない。

`fields.ts` へ足すグループ:

```ts
defineGroup(
  "home",
  "時間割",
  timetableSetting,
  {
    enabled: { label: "時間割を表示する", control: { kind: "toggle" } },
    startDate: { label: "学期の開始日", control: { kind: "date" } },
    lessonCount: {
      label: "授業の回数",
      description: "1コマあたり何回で終わるか",
      control: { kind: "number", min: 1, max: 30, unit: "回" },
    },
    grid: {
      label: "コマ",
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
    color: {
      label: "配色",
      control: {
        kind: "select",
        options: [
          { value: "white", label: "白" },
          { value: "black", label: "黒" },
          { value: "sky", label: "水色" },
          { value: "pink", label: "ピンク" },
          { value: "green", label: "緑" },
        ],
      },
    },
  },
  IcsExportButton,
),
```

## 処理の流れ

### TimetableGridField

1. 曜日ごとの折りたたみを5つ縦に並べる。既定はすべて閉じる
2. 開いた曜日の中に、時限の数だけ行を出す。時限の数と番号は時限表から取る
3. 各行に科目名の入力と URL の入力を置く
4. 科目名が空の行は `null` として保存する
5. 時限表より配列が短い場合、足りない分は空のコマとして扱う

### HolidayListField

`ListField` を使う。行は日付入力1つ（`type="date"`）と、名前のテキスト入力1つ。`createItem` は `{ date: "" }` を返す。

### SubstituteListField

`ListField` を使う。行は日付入力1つと、曜日のセレクト1つ（月曜から金曜）。`createItem` は `{ date: "", weekday: "mon" }` を返す。

### IcsExportButton

1. `timetableSetting` と `periodTableSetting` を読む
2. `buildIcs(config, periodTable.periods)` で文字列を作る
3. `Blob` を `text/calendar;charset=utf-8` で作り、`URL.createObjectURL` で URL にする
4. `<a>` を作って `download` に `ICS_FILENAME` を入れ、クリックして解放する

## 決めごと

- **グリッドを表ではなく、曜日ごとの折りたたみで編集する。** ポップアップの幅は 384px しかなく、5曜日を横に並べると1列 70px ほどになり、科目名を入力できない。縦に積めば狭い幅でも成立する
- **折りたたみは既定で閉じる。** 5曜日 × 6時限を一度に開くと、時間割だけで画面が埋まる
- **科目名が空のコマを `null` として保存する。** 空文字のコマが残ると、表示側が空きコマと区別できない
- **時限の数を時間割側に持たせず、時限表から取る。** 同じ数を2箇所に持つと食い違う
- **`IcsExportButton` は自分で設定を読む。** `footer` に props を渡さないため。設定画面は設定を扱うモジュールなので、`src/utils/settings.ts` を参照してよい。この制約は `src/features/` の各機能（設定の出所を知らない）とは別
- **書き出しは押した時に組み立てる。** あらかじめ作って持たない。設定を変えた直後でも、その時点の内容が出る
- **学期の開始日に既定値を置く。** 空のままでは実日程を組み立てられない。その年の4月1日を初期値にする
- **振替日と休講日が同じ日に指定された場合、休講を優先する。** 実日程の組み立て（[`../timetable/schedule.md`](../timetable/schedule.md)）が休講を先に見る順序に合わせる
