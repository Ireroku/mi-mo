# periods モジュール

## 概要

大学の時限表を表す型と、時刻から時限を引く計算を置く。時計バッジ・カウントダウン・時間割の3つが同じ表を使うため、どれか1つの持ち物にせず切り出す。

## 関連

- 参考: [`../menu/clock.md`](../menu/clock.md) — 移動元。時刻の整形（`formatTime` など）は時計側に残る
- 使う: [`../menu/countdownBadge.md`](../menu/countdownBadge.md) — `findPeriodSegment` の呼び出し側

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/utils/periods.ts` | 時限表の型と、時刻から時限を引く計算 |
| `src/features/menu/clock.logic.ts` | 移した型と関数を import に切り替える |
| `src/features/menu/index.ts` | ローカルの `sortByStart` を捨て、`sortPeriodsByStart` を使う |

## インターフェース

```ts
// src/utils/periods.ts
export interface PeriodSlot {
  // 時限を指す変わらない番号。時間割の授業は、この番号 - 1 の位置に入る
  period: number;
  // 画面に出す名前。無いか空の場合は defaultPeriodName を使う
  name?: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

// 配列の並び順が、時間割と設定画面での表示順になる
export interface PeriodTableConfig {
  periods: PeriodSlot[];
}

export function defaultPeriodName(period: number): string;
export function periodName(slot: PeriodSlot): string;
export function nextPeriodNumber(
  periods: readonly PeriodSlot[],
  taken?: Iterable<number>,
): number;
export function migratePeriodsFromV1(periods: readonly PeriodSlot[]): PeriodSlot[];
export function normalizePeriods(periods: readonly PeriodSlot[]): PeriodSlot[];

export function sortPeriodsByStart(periods: readonly PeriodSlot[]): PeriodSlot[];

export function findCurrentPeriod(
  date: Date,
  periods: PeriodSlot[],
): PeriodSlot | undefined;

export interface PeriodSegment {
  phase: "during" | "before";
  slot: PeriodSlot;
  at: Date;
}

export function findPeriodSegment(
  date: Date,
  sortedPeriods: readonly PeriodSlot[],
): PeriodSegment | undefined;
```

## 処理の流れ

### 番号・名前・並び

時限の枠は3つの値を別々に持つ。

| 値 | 意味 | 変わる時 |
|---|---|---|
| `period` | 時限を指す番号。時間割の授業は、曜日の配列の `period - 1` の位置に入る | 追加の時に振るだけで、変わらない |
| `name` | 画面に出す名前 | 利用者が自由に変える |
| 配列の位置 | 時間割と設定画面での表示の順 | 利用者がドラッグで並べ替える |

1. `defaultPeriodName(n)` は、1〜10 を漢数字（「一限」〜「十限」）、それ以外を算用数字（「11限」）で返す
2. `periodName(slot)` は、`name` の前後の空白を除いた値を返す。空なら `defaultPeriodName(period)` を返す
3. `nextPeriodNumber(periods, taken)` は、表の番号と `taken` の番号を合わせた最大に1を足して返す。どちらも空なら 1。並び順にはよらない。`taken` には時間割に授業の残っている番号を渡す。時限を消しても時間割の授業は残るため、その番号を再び使うと、消した授業が足した時限に現れる

### 保存形式の移行

`periodTableSetting` は WXT の保存項目の版を 2 にし、版 1 の値を `migratePeriodsFromV1` で直す（[`./settings.md`](./settings.md)）。

1. 番号が正の整数でない枠を落とす
2. 番号の昇順に並べる。版 1 は番号の順に時間割を描いていたため、移行の前後で表示の順が変わらない
3. 番号の重なった枠は、先に出たものだけを残す。番号は授業の置き場所を指すため、重なると1つの授業が2つの時限に出る

`name` は足すだけで、無い枠は既定の名前で出る。そのため名前のための移行は要らない。

ファイルから取り込む値は、保存項目の移行を通らない。`normalizePeriods` がその入口を受け持ち、設定画面の `defineGroup` の `normalize`（[`../settings/panel.md`](../settings/panel.md)）から呼ばれる。

1. 番号がすべて正の整数で、重なりが無ければ、並びを含めてそのまま返す。利用者が並べ替えた今の形の表を崩さない
2. そうでなければ版 1 の頃の表とみなし、`migratePeriodsFromV1` で直す

### 時刻から時限を引く

1. `sortPeriodsByStart` は、`start` と `end` がともに `HH:MM` の形の枠だけを、`start` の昇順に並べた新しい配列で返す。元の配列を書き換えない。足したばかりで時刻の空いた枠を除き、時計とカウントダウンが空の時刻を 0:00 として扱わないようにする
2. `findCurrentPeriod` は `start` 以上 `end` 未満に現在時刻が収まる枠を返す。無ければ `undefined`
3. `findPeriodSegment` は表を先頭から見て、現在時刻を含む区切りを返す
   - 現在時刻がある枠の `start` より前なら、`phase: "before"`、`at` にその枠の開始を入れて返す。休み時間と、その日の最初の時限の前にあたる
   - `start` 以上 `end` 未満なら、`phase: "during"`、`at` にその枠の終了を入れて返す
   - どの枠より後なら `undefined` を返す。翌日へは回さない。空の表でも `undefined`

時刻文字列を分に直す内部関数も一緒に移す。

## 決めごと

- **番号と表示の順と名前を、別々の値に持つ。** 時間割の授業は番号で枠を指す。番号を並べ替えや名前の変更に使うと、授業が別の時限へずれる。番号を変えない値にしておけば、名前と順は自由に変えてよい
- **移行は WXT の保存項目の `version` と `migrations` に任せる。** 移行を走らせる時機と、済んだかどうかの記録を自前で持たない。版 1 の値は番号を手で打てたため、重なりや欠けがあり得る
- **取り込みでは、今の形として正しい表を並べ替えない。** 版を持たないファイルでは、並びが利用者の決めた順か番号の順かを区別できない。番号に欠陥がある表だけを版 1 とみなすと、今の形の表は並びが残り、古い表は移行と同じ結果になる
- **`findPeriodSegment` は最後の時限の後に翌日へ回さない。** 翌日へ回すかどうかは表示の都合で、呼び出し側が決める。カウントダウンは「授業終了」を出す
- **シグネチャを変えずに移す。** 呼び出し側の変更を import 文の差し替えだけにとどめる。`undefined` を返す形も含めてそのまま保つ
- **`findPeriodSegment` はソート済みの表を前提とする。** カウントダウンから1秒ごとに呼ばれるため、内部でソートしない。並べ替えは呼び出し側が起動時に1度だけ行う
- **時刻の整形（`formatTime`・`formatDate`・`formatWeekday`）は移さない。** 時限表と関係がなく、時計の表示固有の処理にあたる
- **Moodle に依存しないため `src/utils/` に置く。** 大学の時限は Moodle の画面から読むものではなく、ユーザーが設定するもの
- **時限表そのものの設定は [`./settings.md`](./settings.md) が独立した項目として持つ。** 時計の設定の一部にすると、時間割が時計の設定を読むことになる
- **設定の形を `PeriodSlot[]` ではなく `PeriodTableConfig` で包む。** 設定画面の `defineGroup` はオブジェクトのキーごとに表示メタを要求する（[`../settings/panel.md`](../settings/panel.md) の `FieldsOf<C>`）。配列をそのまま保存すると、添字に対してメタを書く形になり成立しない
