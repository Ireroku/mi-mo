# settings の入力部品

## 概要

設定画面の各 Fields が共通して使う入力部品を置く。時刻・日付の選択、候補つきの入力欄、続けるかの確かめ、関係する入力欄の積み重ね、カードの中の操作の行と別の画面へ進む行。どれも値を自分で保存せず、`onChange` や `onConfirm` で呼び出し側へ返す。

## 関連

- 使う: [`panel.md`](./panel.md) — shadcn-svelte の部品（`popover`、`calendar`、`alert-dialog`、`input-group`、`input`）と、`global.css` の動きの長さ ／ bits-ui の `Combobox`
- 使われる: [`panel.md`](./panel.md) の `FieldRow`・`BackupButtons`・`ResetRows` ／ [`timetableFields.md`](./timetableFields.md) の `IcsExportButton` ／ [`menuFields.md`](./menuFields.md) の `PeriodTableField` ／ [`menuFields.md`](./menuFields.md) の `HiddenMenuItemsField`・`NewMenuItemsField`・`CountdownListField` ／ [`timetableFields.md`](./timetableFields.md) の `TimetableGridField`・`HolidayListField`・`SubstituteListField`
- 資料: [bits-ui の AlertDialog](https://bits-ui.com/docs/components/alert-dialog) ／ [shadcn-svelte の Date Picker](https://shadcn-svelte.com/docs/components/date-picker) ／ [bits-ui の Combobox](https://bits-ui.com/docs/components/combobox)

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/settings/controls/StackedInputs.svelte` | 関係する入力欄を1つの枠へ区切り線で積む |
| `src/features/settings/controls/SuggestInput.svelte` | 自由に書ける入力欄に、フォーカスで開く候補の一覧を添える |
| `src/features/settings/controls/TimePicker.svelte` | 24時間表記の時刻を、打つか時と分の列から選んで入れる |
| `src/features/settings/controls/time.logic.ts` | 打った文字を `"HH:MM"` へ揃える純粋な関数 |
| `src/features/settings/controls/time.logic.test.ts` | `normalizeTime` の単体テスト |
| `src/features/settings/controls/DatePicker.svelte` | 日本語の暦から日付を選ぶ |
| `src/features/settings/controls/ConfirmDialog.svelte` | 取り消せない操作の前に続けるかを尋ねる |
| `src/features/settings/controls/ActionRow.svelte` | カードの中で横いっぱいに広がる、押すと操作を始める行 |
| `src/features/settings/controls/OpenRow.svelte` | 押すと別の画面へ進む行 |

## インターフェース

```ts
// StackedInputs.svelte
interface Props {
  children: Snippet; // 1行に1つずつ並べる。行は Input・ボタン・DatePicker・Select、またはそれらを含む要素
  class?: string;
}

// SuggestInput.svelte
interface Props {
  value: string;
  onChange: (next: string) => void; // 打つたびと、候補を選んだ時に呼ぶ
  suggestions: readonly string[]; // 出す候補。外す名前は呼び出し側で除いておく
  placeholder?: string;
  "aria-label"?: string;
}

// TimePicker.svelte
interface Props {
  value: string; // "HH:MM"。未入力は ""
  onChange: (next: string) => void;
  label: string; // 読み上げ用の名前。画面には出さない
  class?: string;
}

// time.logic.ts
export function normalizeTime(text: string): string | undefined;

// DatePicker.svelte
interface Props {
  value: string; // "YYYY-MM-DD"。未入力は ""
  onChange: (next: string) => void;
  id?: string;
}

// ConfirmDialog.svelte
interface Props {
  open: boolean; // $bindable
  title: string; // 尋ねる文
  confirmLabel: string; // 続けるボタンの文言
  destructive?: boolean; // 元に戻せない操作。続けるボタンを赤にする
  onConfirm: () => void;
}

// ActionRow.svelte。残りの属性は button へそのまま渡す
interface Props extends Omit<HTMLButtonAttributes, "children"> {
  label: string;
  icon?: Component<{ class?: string }>; // 左に添えるアイコン
  danger?: boolean; // 範囲の大きい破壊的な操作。文字を赤にする
}

// OpenRow.svelte
interface Props {
  label: string;
  description?: string;
  count?: number; // 一覧の件数。「6件」の形で右に出す
  class?: ClassValue; // 置き場所に合わせた余白
  onclick: () => void;
}
```

## 処理の流れ

### TimePicker

1. 入力欄と、時計のボタンを `InputGroup` で1つの枠に並べる
2. 入力欄で Enter を押すか、フォーカスが外れた時に `normalizeTime` で揃える。揃えた値が今の値と違えば `onChange` を呼ぶ
3. 読めない文字と空の文字は、入力欄を今の値へ戻す。空にして時刻を消すことはしない
4. 時計のボタンで `Popover` を開く。中に「時」（00〜23）と「分」（00〜55、5分刻み）の2列を並べ、開いた時に選ばれている値を列の真ん中へ寄せる
5. 時を選ぶと、分は今の値を残して `onChange` を呼び、小窓は開いたままにする。分を選ぶと `onChange` を呼んで小窓を閉じる。片方が未入力なら `00` で埋める

### normalizeTime

| 打った文字 | 結果 |
|---|---|
| `9:30`、`09:30` | `09:30` |
| `9`、`09` | `09:00` |
| `930`、`0930` | `09:30` |
| 全角の `９：３０` | `09:30` |
| `24:00`、`9:60`、`abc`、`12345` | `undefined` |

1. NFKC で全角を半角へ揃え、前後の空白を除く
2. `H:MM` か `HH:MM` の形なら、コロンの前を時、後を分として読む
3. 1〜4桁の数字だけなら、2桁までは時だけ、3桁以上は末尾の2桁を分として読む
4. 時が 23、分が 59 を超えれば `undefined` を返す。それ以外は2桁ずつ0で埋めて返す

### StackedInputs

1. 枠と区切り線を持つ `div` を置き、中の部品を1行ずつ縦に積む
2. 中の `data-slot` が `input`・`button`・`popover-trigger`・`select-trigger` の部品から、枠・角丸・背景・影・フォーカスの輪を外し、幅いっぱいに広げ、文字を `text-sm` に揃える
3. ボタンと DatePicker の中身は左へ寄せる
4. 中の部品がキーボードでフォーカスされた時は、外の枠にフォーカスの輪を出す

### SuggestInput

1. bits-ui の `Combobox`（`type="single"`）で組む。入力欄は shadcn の `Input` を `child` で使う
2. 入力欄にフォーカスすると候補の一覧を開く。打つと、打った文字を含む候補だけに絞る。大文字と小文字は区別しない。欄が空なら全部を出す
3. 打った文字はそのまま `onChange` へ渡す。候補に無い文字も入る
4. 候補を選ぶと、その文字列を `onChange` へ渡す
5. 絞った結果が空なら一覧を出さない

### DatePicker

1. `value` を `@internationalized/date` の `parseDate` で読む。読めなければ未入力として扱う
2. ボタンに日付を `ja` の `dateStyle: "medium"` で出す。未入力なら「日付を選ぶ」と出す
3. ボタンで `Popover` を開き、`Calendar` を `locale="ja"` で出す
4. 日付を選ぶと `"YYYY-MM-DD"` を `onChange` へ渡し、小窓を閉じる

### ConfirmDialog

1. `open` が真の間、`AlertDialog` に `title` と「キャンセル」「`confirmLabel`」を出す
2. 「キャンセル」と Esc は閉じるだけにする
3. 続けるボタンを押すと、閉じてから `onConfirm` を呼ぶ
4. `destructive` の間は、続けるボタンを `variant="destructive"`（赤）にする

### ActionRow

1. `min-h-12 w-full` の `button` に、左寄せで `icon` と `label` を並べる。枠と背景は持たず、カードの区切り線の間に収まる
2. 文字は `text-primary`（青）、`danger` の間は `text-destructive`（赤）にする
3. 押している間は `active:opacity-60` で薄くする

### OpenRow

1. 左に `label` と `description`、右に `count` と右向きの山形を置く
2. 余白は置き場所ごとに違うため、`class` で受け取る。`FieldRow` は行の余白を打ち消す負の余白を、`ResetRows` は `min-h-12 w-full` を渡す

## 決めごと

- **部品は `src/features/settings/controls/` に置き、`src/lib/components/ui/` には置かない。** `ui/` は shadcn-svelte の CLI が書き換える場所で、手で作った部品を混ぜると CLI での追加の時に上書きされる
- **部品は値を保存しない。** 保存と直列化は `SettingsPanel` が持つ。部品が保存すると、同じ値を2箇所で書くことになる
- **時刻は `<input type="time">` を使わず、打つ欄と選ぶ小窓を並べる。** ブラウザと OS の設定によって、`type="time"` は12時間表記で出る。授業の時刻は24時間表記で揃えたい
- **時刻の小窓の分は5分刻みにする。** 授業の時刻は5分刻みに収まる。それ以外の分は入力欄へ打てば入る
- **時を選んでも小窓を閉じない。** 時と分を続けて選ぶのが普通の使い方で、時のたびに閉じると開き直す手間が増える
- **打った時刻が読めない時は、黙って元の値へ戻す。** 誤りの文を出す場所が、時限表の1行の中に無い。元へ戻れば、入らなかったことは見て分かる
- **`normalizeTime` を `.logic.ts` に分ける。** 打ち方の揺れは組み合わせが多く、画面を開かずに単体テストで確かめるため
- **日付の暦は `locale="ja"` にする。** 曜日と月の名前を日本語で出す。週の始まりも日本の暦に合う
- **`ConfirmDialog` の続けるボタンは、自分で閉じる。** bits-ui v2 の `AlertDialog.Action` は押しても閉じない。閉じてから `onConfirm` を呼び、呼んだ先の処理が長くても画面が残らないようにする
- **カードの中の操作は、枠つきのボタンではなく `ActionRow` の行にする。** 行の高さと区切り線が設定の行と揃い、カードの中で別の形が混ざらない。押せることは色で示す
- **`ActionRow` の赤は、範囲の大きい操作だけに使う。** 個別のリセットや読み込みは行を青にし、確認のボタンだけを赤にする。色の段階は [`../../ui-principles.md`](../../ui-principles.md) に従う
- **`OpenRow` を `FieldRow` から分ける。** リセットの階層も同じ形の行で進むため。形を1箇所に置き、別の画面へ進む行の見た目が揃う
- **`StackedInputs` の中の部品は枠を外し、枠の側でフォーカスを示す。** 名前と URL、日付と理由のように組になる欄を1つのまとまりに見せる。中の部品にもフォーカスの輪を残すと、輪が二重になる
- **`StackedInputs` は中の部品を `data-slot` で見分ける。** shadcn の部品は自分の `data-slot` を持つ。DatePicker の開くボタンは `popover-trigger` になるため、`button` とは別に並べる
- **`StackedInputs` の中は文字を `text-sm` に揃える。** shadcn の `Input` は幅 768px 未満で `text-base` になり、ボタンや Select の `text-sm` と1つの枠の中で大きさが食い違う
- **候補つきの欄は bits-ui の `Combobox` で作り、`<datalist>` を使わない。** `<datalist>` は開くきっかけと見た目がブラウザごとに違い、フォーカスだけでは開かないものがある
- **候補つきの欄は自由な文字も受ける。** 候補は控えた時点のもので、Moodle 側の項目が変わっても書けるようにする
