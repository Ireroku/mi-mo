# timetable panel モジュール

## 概要

時間割を週の表としてホームへ差し込む。サイトホームとダッシュボードのどちらでも表示し、差し込み先だけをページ種別で切り替える。各コマには科目名と、その週で何回目かを並べる。

## 関連

- 使う: [`./schedule.md`](./schedule.md) — 実日程と回数。表示する値はすべてここから受け取る
- 使う: [`../moodle/page.md`](../moodle/page.md) — サイトホームとダッシュボードの判定
- 使う: [`../utils/periods.md`](../utils/periods.md) — 時限の番号と時刻
- 資料: [`../../moodle/home.md`](../../moodle/home.md) — 2つのページそれぞれの差し込み先
- 参考: [`../menu/clock.md`](../menu/clock.md) — `createShadowRootUi` でバッジを差し込む書き方

## 対象ファイル

| パス | 役割 |
|---|---|
| `src/features/timetable/index.ts` | 設定を受け取り、差し込み先を探してマウントする |
| `src/features/timetable/mount.dom.ts` | ページ種別ごとの差し込み先 |
| `src/features/timetable/Timetable.svelte` | 週の表の描画 |
| `src/entrypoints/shared.content.ts` | 設定を読み、初期化を呼ぶ |

## インターフェース

```ts
// src/features/timetable/mount.dom.ts
export interface TimetableMountPoint {
  anchor: string;
  append: "before" | "first";
}

export function findMountPoint(): TimetableMountPoint | undefined;
```

```ts
// src/features/timetable/index.ts
export async function initTimetable(
  ctx: ContentScriptContext,
  config: TimetableConfig,
  periods: PeriodSlot[],
): Promise<void>;
```

```ts
// Timetable.svelte の Props
interface Props {
  config: TimetableConfig;
  periods: PeriodSlot[];
  schedule: LessonOccurrence[];
}
```

entrypoint からの呼び出し。`main()` の中でこのモジュールが担当するのは次の行だけで、他の機能の行は触りません。

```ts
// src/entrypoints/shared.content.ts
import { initTimetable } from "@/features/timetable";
import { timetableSetting, periodTableSetting } from "@/utils/settings";

const [timetableConfig, periodTable] = await Promise.all([
  timetableSetting.getValue(),
  periodTableSetting.getValue(),
]);

if (timetableConfig.enabled) {
  await initTimetable(ctx, timetableConfig, periodTable.periods);
}
```

設定の定義:

```ts
// src/utils/settings.ts
export const timetableSetting = storage.defineItem<TimetableConfig>(
  "local:home.timetable",
  { fallback: /* 空のグリッドと、その年度の開始日 */ },
);
```

## 処理の流れ

### findMountPoint

[`../moodle/page.md`](../moodle/page.md) の判定を使い、次を返す。どちらでもない場合は `undefined`。

| ページ | anchor | append |
|---|---|---|
| サイトホーム | `#region-main div.course-content` | `before` |
| ダッシュボード | `#block-region-content` | `first` |

### initTimetable

1. `findMountPoint()` を呼ぶ。`undefined` なら何もせず戻る
2. `buildSchedule(config, periods)` で実日程を組み立てる
3. `createShadowRootUi` で `Timetable.svelte` をマウントする

| 設定 | 値 |
|---|---|
| `name` | `mimo-timetable` |
| `position` | `inline` |
| `anchor` | `findMountPoint()` の `anchor` |
| `append` | `findMountPoint()` の `append` |

### Timetable.svelte

1. 今日を含む週（月曜から金曜）の5日を求める
2. 各日について `lessonsOn` を呼び、その日のコマを引く
3. 縦に時限、横に曜日を並べた表を描く
4. 各セルに科目名と、`count` を「第N回」として小さく添える
5. `slot.url` があるセルはリンクにする
6. 今日の曜日の列に背景を敷いて強調する
7. 休講で何も無い日の列は、日付の下に「休講」と出す

### 配色

`config.color` の5色を、ルート要素の `data-mimo-color` 属性で切り替える。色ごとにライトとダークの2組を持ち、`prefers-color-scheme: dark` で入れ替える。

| 値 | 見た目 |
|---|---|
| `white` | 白地 |
| `black` | 黒地 |
| `sky` | 水色 |
| `pink` | ピンク |
| `green` | 緑 |

## 決めごと

- **サイトホームとダッシュボードの両方に出す。** 仕様書の対象が「ホーム」で、Moodle ではこの2つが別ページにあたる。どちらを開いても同じものが見えるようにする
- **差し込み先の違いを `mount.dom.ts` に閉じ込める。** 表示側はどのページに出ているかを知らない
- **`createShadowRootUi` を使い、Moodle の CSS から隔離する。** Moodle 側の表のスタイルが当たると、行の高さや罫線が崩れる
- **表示するのは今週だけにする。** 前後の週へ送る操作は仕様書に無い。学期全体は `.ics` へ書き出して他のアプリで見る形にする
- **回数は表示している週の回数を出す。** 「次に何回目か」ではなく、そのセルが指す授業が何回目かを出す
- **空きコマは空欄にする。** 「なし」などの文字を置くと、埋まっているコマと見分けにくくなる
- **色はカレンダー全体にかけ、コマごとには持たせない。** 仕様書の設定項目が「色」1つのため
- **ダークモードは、選んだ色の暗い側の組へ切り替える形にする。** Moodle 自体はダークテーマを持たないため、`white` を選んだ状態でも周囲は白いままになる。暗くしたい場合は `black` を選ぶ
- **`enabled` が false の時は entrypoint 側で呼ばない。** 設定が切れているときに実日程の計算まで走らせない
- **マイコースの並び順（[`../../features/my-courses/today-order.md`](../../features/my-courses/today-order.md)）はこのモジュールに含めない。** 同じ設定を読む別の機能として分ける
