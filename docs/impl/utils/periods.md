# periods モジュール

## 概要

大学の時限表を表す型と、時刻から時限を引く計算を置く。時計バッジ・カウントダウン・時間割の3つが同じ表を使うため、どれか1つの持ち物にせず切り出す。

## 関連

- 参考: [`../menu/clock.md`](../menu/clock.md) — 移動元。時刻の整形（`formatTime` など）は時計側に残る
- 使う: [`../menu/countdownBadge.md`](../menu/countdownBadge.md) — `findNextPeriodStart` の呼び出し側

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
  period: number;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface PeriodTableConfig {
  periods: PeriodSlot[];
}

export function sortPeriodsByStart(periods: PeriodSlot[]): PeriodSlot[];

export function findCurrentPeriod(
  date: Date,
  periods: PeriodSlot[],
): PeriodSlot | undefined;

export function findNextPeriodStart(
  date: Date,
  sortedPeriods: PeriodSlot[],
): Date | undefined;
```

## 処理の流れ

既存の実装をそのまま移す。振る舞いを変えない。

1. `sortPeriodsByStart` は `start` の昇順に並べた新しい配列を返す。元の配列を書き換えない
2. `findCurrentPeriod` は `start` 以上 `end` 未満に現在時刻が収まる枠を返す。無ければ `undefined`
3. `findNextPeriodStart` は現在時刻より後で最も近い開始時刻を返す。当日に残りが無ければ翌日の最初の時限へ回す。空の表なら `undefined`

時刻文字列を分に直す内部関数も一緒に移す。

## 決めごと

- **シグネチャを変えずに移す。** 呼び出し側の変更を import 文の差し替えだけにとどめる。`undefined` を返す形も含めてそのまま保つ
- **`findNextPeriodStart` はソート済みの表を前提とする。** カウントダウンから1秒ごとに呼ばれるため、内部でソートしない。並べ替えは呼び出し側が起動時に1度だけ行う
- **時刻の整形（`formatTime`・`formatDate`・`formatWeekday`）は移さない。** 時限表と関係がなく、時計の表示固有の処理にあたる
- **Moodle に依存しないため `src/utils/` に置く。** 大学の時限は Moodle の画面から読むものではなく、ユーザーが設定するもの
- **時限表そのものの設定は [`./settings.md`](./settings.md) が独立した項目として持つ。** 時計の設定の一部にすると、時間割が時計の設定を読むことになる
- **設定の形を `PeriodSlot[]` ではなく `PeriodTableConfig` で包む。** 設定画面の `defineGroup` はオブジェクトのキーごとに表示メタを要求する（[`../settings/panel.md`](../settings/panel.md) の `FieldsOf<C>`）。配列をそのまま保存すると、添字に対してメタを書く形になり成立しない
