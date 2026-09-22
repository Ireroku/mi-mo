# timetable schedule モジュール

## 概要

時間割の設定から、学期の実日程を組み立てる。休講日を飛ばし、振替日は別の曜日の授業に差し替えたうえで、各コマが何回目かを数える。DOM も描画も扱わない純粋な計算だけを置く。

## 関連

- 使う: [`../utils/periods.md`](../utils/periods.md) — 各時限の開始・終了時刻
- 資料: [`../../features/home/timetable.md`](../../features/home/timetable.md) — 回数の数え方と振替の扱いが必要な理由
- 参考: [`../menu/countdownBadge.md`](../menu/countdownBadge.md) — 設定を受け取って計算だけを行うモジュールの形

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/timetable/types.ts` | 時間割の設定の型 |
| `src/features/timetable/schedule.logic.ts` | 実日程の組み立てと回数の計算 |

## インターフェース

```ts
// src/features/timetable/types.ts
import type { PeriodSlot } from "@/utils/periods";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri";

export interface TimetableSlot {
  title: string;
  url?: string;
}

export interface TimetableHoliday {
  date: string; // "YYYY-MM-DD"
  label?: string;
}

export interface TimetableSubstitute {
  date: string; // "YYYY-MM-DD"
  weekday: Weekday; // この日に行う授業の曜日
}

export type TimetableColor = "white" | "black" | "sky" | "pink" | "green";

export interface TimetableConfig {
  enabled: boolean;
  startDate: string; // 学期の開始日 "YYYY-MM-DD"
  lessonCount: number; // 1コマあたりの授業回数
  grid: Record<Weekday, (TimetableSlot | null)[]>; // 時限の順に並べる
  holidays: TimetableHoliday[];
  substitutes: TimetableSubstitute[];
  color: TimetableColor;
}
```

```ts
// src/features/timetable/schedule.logic.ts
export interface LessonOccurrence {
  date: Date; // 実際に行う日
  weekday: Weekday; // 行う授業の曜日。振替の日は振替元の曜日
  periodIndex: number; // grid の配列の添字
  slot: TimetableSlot;
  count: number; // このコマにとって何回目か
}

export function buildSchedule(
  config: TimetableConfig,
  periods: PeriodSlot[],
): LessonOccurrence[];

export function lessonsOn(
  date: Date,
  schedule: readonly LessonOccurrence[],
): LessonOccurrence[];

export function weekdayOf(date: Date): Weekday | undefined;
```

## 処理の流れ

### buildSchedule

1. `config.startDate` の日から1日ずつ進める
2. その日が `holidays` に含まれる場合、何も行わずに次の日へ進む
3. その日が `substitutes` に含まれる場合、行う授業の曜日をその指定に差し替える。含まれない場合は `weekdayOf` で求めた曜日を使う
4. 曜日が `undefined`（土曜・日曜）の場合、何も行わずに次の日へ進む
5. その曜日の `grid` を時限の順に見て、`null` でないコマそれぞれについて `LessonOccurrence` を作る。`count` はそのコマ（曜日と時限の組）にとって何回目かを数えた値
6. すべてのコマが `config.lessonCount` 回に達した時点で終わる
7. 開始日から 365 日を超えた時点でも終わる

### lessonsOn

`schedule` から、`date` と同じ日のものを時限の順に返す。時刻は見ない。

### weekdayOf

`Date` の曜日を `Weekday` へ直す。土曜と日曜は `undefined` を返す。

## 決めごと

- **回数は「コマごと」に数える。** 月曜3限と火曜1限では休講の当たり方が違うため、学期全体で通し番号を振ると実態と合わない
- **振替日は振替元の曜日として数える。** 「この日は月曜の授業を行う」と指定した日は、月曜のコマの回数が1つ進む。振替先の曜日（実際の曜日）のコマは進まない
- **休講日は全コマを飛ばす。** 特定のコマだけを休みにする指定は作らない。仕様書が求めているのは「休講日や大学の休業日」という日単位の指定
- **同じ日が休講日と振替日の両方に指定された場合、休講を優先する。** 処理の順序で休講を先に見る。どちらが勝つかを決めておかないと、設定の入力ミスで日程が静かにずれる
- **終了条件を「全コマが所定の回数に達すること」にする。** 学期の終了日を別に設定させない。休講が多いコマがあれば、その分だけ日程が後ろへ伸びる
- **365 日の上限を置く。** 設定次第（回数が大きい、grid が空など）で終わらなくなるため、無条件に止まる線を引く
- **土曜と日曜は授業を置かない。** `Weekday` を月曜から金曜に限る。土曜開講が必要になった時点で型を広げる
- **`grid` は曜日ごとの配列で持ち、添字を時限に対応させる。** 時限の数は [`../utils/periods.md`](../utils/periods.md) の時限表に従う。配列の長さが時限表より短い場合、足りない分は空きコマとして扱う
- **`Date` を返し、文字列にしない。** 表示側で書式を決めるため。設定として保存する日付だけ `YYYY-MM-DD` の文字列にする
- **このモジュールは時刻を持たない。** 各コマの開始・終了時刻は時限表にあり、`.ics` の書き出し（[`./ics.md`](./ics.md)）が組み合わせる
